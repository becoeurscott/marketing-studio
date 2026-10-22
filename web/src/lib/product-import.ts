import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

/** Product link import: reads a shop/marketplace page and returns its main product photo, name and price. */

export class ImportError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}

/** Link-preview bots first: shops, Facebook and Instagram serve them the product preview (og:image) even when they block other servers. */
const AGENTS = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "WhatsApp/2.24.6.77 A",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
];
const UA = AGENTS[2];

function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** Blocks requests to internal addresses (SSRF): every hop of a redirect is re-checked. */
async function assertPublic(u: URL) {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new ImportError("Lien invalide : utilisez une adresse http(s).", 400);
  if (u.username || u.password) throw new ImportError("Lien invalide.", 400);
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new ImportError("Lien non autorisé.", 400);
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => { throw new ImportError("Site introuvable. Vérifiez le lien.", 400); });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new ImportError("Lien non autorisé.", 400);
}

async function safeFetch(raw: string, accept: string, maxBytes: number, ua = UA): Promise<{ url: URL; type: string; body: Buffer }> {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": ua, accept, "accept-language": "fr-FR,fr;q=0.9,en;q=0.8" }, signal: AbortSignal.timeout(10_000) });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { url = new URL(res.headers.get("location")!, url); continue; }
    if (!res.ok || !res.body) throw new ImportError(`Le site a refusé l'accès (${res.status}). Importez plutôt la photo.`, 422);
    if (Number(res.headers.get("content-length")) > maxBytes) throw new ImportError("Fichier trop lourd.", 413);
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel().catch(() => {}); throw new ImportError("Fichier trop lourd.", 413); }
      chunks.push(value);
    }
    return { url, type: (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(), body: Buffer.concat(chunks) };
  }
  throw new ImportError("Trop de redirections.", 422);
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function meta(html: string, keys: string[]): string | undefined {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i");
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return decode(m[1]);
  }
}

interface Found { name?: string; price?: string; currency?: string; images: string[] }

/** schema.org Product in JSON-LD (Shopify, WooCommerce, Jumia and most shops). */
function jsonLd(html: string): Found {
  const out: Found = { images: [] };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const stack: unknown[] = [data];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { stack.push(...n); continue; }
      const o = n as Record<string, unknown>;
      if (o["@graph"]) stack.push(o["@graph"]);
      const t = o["@type"];
      if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
        out.name ??= typeof o.name === "string" ? o.name : undefined;
        const imgs = Array.isArray(o.image) ? o.image : [o.image];
        for (const i of imgs) {
          const u = typeof i === "string" ? i : (i as { url?: string } | null)?.url;
          if (u) out.images.push(u);
        }
        const offers = (Array.isArray(o.offers) ? o.offers[0] : o.offers) as Record<string, unknown> | undefined;
        const price = offers?.price ?? (offers?.priceSpecification as Record<string, unknown> | undefined)?.price ?? offers?.lowPrice;
        if (price != null) out.price ??= String(price);
        if (typeof offers?.priceCurrency === "string") out.currency ??= offers.priceCurrency;
      }
    }
  }
  return out;
}

function safeHost(l: string) { try { return new URL(/^https?:/i.test(l) ? l : "https://" + l).hostname; } catch { return "invalid"; } }

export interface ImportedProduct { image: Buffer; name: string; price?: string; currency?: string; source: string }

export async function importProduct(link: string): Promise<ImportedProduct> {
  let page: Awaited<ReturnType<typeof safeFetch>> | undefined;
  let lastError: unknown;
  for (const ua of AGENTS) {
    try {
      const p = await safeFetch(link.trim(), "text/html,application/xhtml+xml,image/*;q=0.8", 3 * 1024 * 1024, ua);
      if (p.type.startsWith("image/") || /og:image|application\/ld\+json|twitter:image/i.test(p.body.toString("utf8"))) { page = p; break; }
      page ??= p;
    } catch (e) {
      lastError = e;
      if (e instanceof ImportError && e.status === 400) throw e;
    }
  }
  if (!page) {
    console.warn("product_import_failed", { host: safeHost(link), reason: lastError instanceof Error ? lastError.message : "fetch" });
    if (lastError instanceof ImportError) throw lastError;
    throw new ImportError("Impossible d'ouvrir ce lien. Vérifiez-le ou importez la photo.", 422);
  }

  let found: Found = { images: [] };
  let candidates: string[] = [];
  if (page.type.startsWith("image/")) {
    return { image: await toJpeg(page.body), name: decodeURIComponent(page.url.pathname.split("/").pop() ?? "Produit").replace(/\.[a-z]+$/i, "").slice(0, 60) || "Produit", source: page.url.toString() };
  }
  const html = page.body.toString("utf8");
  found = jsonLd(html);
  candidates = [
    ...found.images,
    meta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src", "image"]),
    html.match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)?.[1],
  ].filter((x): x is string => !!x).map((u) => { try { return new URL(decode(u), page.url).toString(); } catch { return ""; } }).filter(Boolean);
  if (!candidates.length) console.warn("product_import_failed", { host: page.url.hostname, reason: "no_image" });
  if (!candidates.length) throw new ImportError("Aucune photo de produit trouvée sur cette page. Importez la photo directement.", 422);

  const name = (found.name ?? meta(html, ["og:title", "twitter:title"]) ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "Produit").trim();
  const price = found.price ?? meta(html, ["product:price:amount", "og:price:amount", "price"]);
  const currency = found.currency ?? meta(html, ["product:price:currency", "og:price:currency", "priceCurrency"]);

  for (const c of [...new Set(candidates)].slice(0, 4)) {
    try {
      const img = await safeFetch(c, "image/avif,image/webp,image/png,image/jpeg,image/*", 10 * 1024 * 1024);
      return { image: await toJpeg(img.body), name: decode(name).slice(0, 80), price, currency, source: page.url.toString() };
    } catch { /* try the next candidate */ }
  }
  console.warn("product_import_failed", { host: page.url.hostname, reason: "image_download" });
  throw new ImportError("La photo du produit n'a pas pu être téléchargée. Importez-la directement.", 422);
}

/** Decode whatever the shop serves (webp, avif, png…) and store a clean JPEG ≤ 2048 px. */
async function toJpeg(bytes: Buffer): Promise<Buffer> {
  try {
    const img = sharp(bytes, { limitInputPixels: 40_000_000, pages: 1 });
    const info = await img.metadata();
    if (!info.width || !info.height || info.width < 200 || info.height < 200) throw new ImportError("Image trop petite.", 422);
    return await img.rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("Image illisible.", 422);
  }
}
