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

/** Seeded placeholder image. */
export function img(seed: string, w = 800, h = 1000): string {
  return `https://picsum.photos/seed/${slugify(seed)}/${w}/${h}`;
}

export function avatar(n: number): string {
  return `https://i.pravatar.cc/300?img=${n}`;
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
