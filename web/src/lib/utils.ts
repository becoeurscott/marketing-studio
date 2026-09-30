export type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny className joiner (no deps). */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const inner = cn(...v);
      if (inner) out.push(inner);
    } else out.push(String(v));
  }
  return out.join(" ");
}

let counter = 0;
/** Client-safe unique id with a readable prefix. */
export function uid(prefix = "id"): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter}${rand}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const PALETTES = [["#F97316", "#FACC15"], ["#16A34A", "#FACC15"], ["#EA580C", "#16A34A"], ["#0A0A0A", "#F97316"]];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Local placeholder graphic (no stock photo): brand gradient with an optional label. */
export function img(seed: string, w = 800, h = 1000, label = ""): string {
  const [a, b] = PALETTES[hash(seed) % PALETTES.length];
  const text = label ? `<text x="50%" y="50%" fill="#0A0A0A" font-family="Inter,system-ui,sans-serif" font-size="${Math.round(w / 16)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label.replace(/[<&>"]/g, "")}</text>` : "";
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${text}</svg>`);
}

/** Initials avatar (no stock face). `n` picks a color variant, or pass a name. */
export function avatar(n: number | string): string {
  const name = typeof n === "string" ? n : "";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "S";
  const [a, b] = PALETTES[(typeof n === "number" ? n : hash(name)) % PALETTES.length];
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><text x="50%" y="52%" fill="#0A0A0A" font-family="Inter,system-ui,sans-serif" font-size="120" font-weight="700" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l’instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d / 7);
  if (w < 5) return `il y a ${w} sem.`;
  return formatDate(iso, { day: "numeric", month: "short" });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1); // never in the future
  return d.toISOString();
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Bonsoir";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

/** Opens a generated file for download (cross-origin files open in a new tab). */
export function downloadUrl(url: string, filename?: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  if (filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
