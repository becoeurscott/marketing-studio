/**
 * African-market config: countries, currencies, Mobile Money, local languages,
 * pay-as-you-go packs and the local promo calendar.
 *
 * Every price is defined once in FCFA (XOF) and converted per country with the
 * indicative rates below. Change prices or rates here and the whole app follows.
 */

/* ---------- Currencies ---------- */
export type CurrencyCode = "XOF" | "XAF" | "NGN" | "KES" | "GHS" | "CDF";

export const CURRENCIES: Record<CurrencyCode, { label: string; symbol: string; perXof: number; step: number }> = {
  XOF: { label: "Franc CFA (UEMOA)", symbol: "FCFA", perXof: 1, step: 100 },
  XAF: { label: "Franc CFA (CEMAC)", symbol: "FCFA", perXof: 1, step: 100 },
  NGN: { label: "Naira", symbol: "₦", perXof: 2.7, step: 100 },
  KES: { label: "Shilling kényan", symbol: "KSh", perXof: 0.23, step: 10 },
  GHS: { label: "Cedi", symbol: "GH₵", perXof: 0.025, step: 1 },
  CDF: { label: "Franc congolais", symbol: "FC", perXof: 5, step: 500 },
};

/* ---------- Payments ---------- */
export type PaymentMethodId = "wave" | "orange-money" | "mtn-momo" | "moov-money" | "mpesa" | "airtel-money" | "card";

export const PAYMENT_METHODS: Record<PaymentMethodId, { label: string; short: string; color: string; mobile: boolean }> = {
  wave: { label: "Wave", short: "W", color: "#1DC8F2", mobile: true },
  "orange-money": { label: "Orange Money", short: "OM", color: "#FF7900", mobile: true },
  "mtn-momo": { label: "MTN MoMo", short: "MTN", color: "#FFCC00", mobile: true },
  "moov-money": { label: "Moov Money", short: "Moov", color: "#0067B1", mobile: true },
  mpesa: { label: "M-Pesa", short: "M", color: "#4CAF50", mobile: true },
  "airtel-money": { label: "Airtel Money", short: "A", color: "#E40000", mobile: true },
  card: { label: "Carte bancaire", short: "CB", color: "#71717A", mobile: false },
};

/* ---------- Languages (text + voice-over) ---------- */
export type LanguageId = "fr" | "en" | "wo" | "dyu" | "bm" | "ln" | "sw" | "pcm";

export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "Anglais" },
  { id: "wo", label: "Wolof" },
  { id: "dyu", label: "Dioula" },
  { id: "bm", label: "Bambara" },
  { id: "ln", label: "Lingala" },
  { id: "sw", label: "Swahili" },
  { id: "pcm", label: "Pidgin" },
];

export const languageLabel = (id: LanguageId) => LANGUAGES.find((l) => l.id === id)?.label ?? id;

/* ---------- Countries ---------- */
export type CountryCode = "SN" | "CI" | "ML" | "BF" | "CM" | "CD" | "NG" | "GH" | "KE";

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  currency: CurrencyCode;
  dialCode: string;
  payments: PaymentMethodId[];
  languages: LanguageId[];
}

export const COUNTRIES: Country[] = [
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", dialCode: "221", payments: ["wave", "orange-money", "card"], languages: ["fr", "wo"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", dialCode: "225", payments: ["wave", "orange-money", "mtn-momo", "moov-money", "card"], languages: ["fr", "dyu"] },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", dialCode: "223", payments: ["orange-money", "wave", "moov-money", "card"], languages: ["fr", "bm"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", dialCode: "226", payments: ["orange-money", "moov-money", "wave", "card"], languages: ["fr", "dyu"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", dialCode: "237", payments: ["mtn-momo", "orange-money", "card"], languages: ["fr", "en", "pcm"] },
  { code: "CD", name: "RD Congo", flag: "🇨🇩", currency: "CDF", dialCode: "243", payments: ["mpesa", "orange-money", "airtel-money", "card"], languages: ["fr", "ln", "sw"] },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", dialCode: "234", payments: ["mtn-momo", "airtel-money", "card"], languages: ["en", "pcm"] },
  { code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", dialCode: "233", payments: ["mtn-momo", "airtel-money", "card"], languages: ["en", "pcm"] },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", dialCode: "254", payments: ["mpesa", "airtel-money", "card"], languages: ["en", "sw"] },
];

/** Pilot country, used as the default everywhere until the user picks another one. */
export const DEFAULT_COUNTRY: CountryCode = "CI";

export const countryOf = (code: CountryCode | null | undefined): Country =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY)!;

/* ---------- Prices ---------- */
/** Convert an FCFA amount to the country's currency, rounded to a clean step. */
export function convertXof(amountXof: number, currency: CurrencyCode): number {
  const c = CURRENCIES[currency];
  const raw = amountXof * c.perXof;
  return Math.max(c.step, Math.round(raw / c.step) * c.step);
}

/** "1 000 FCFA", "₦2 700", "KSh 230". */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  const { symbol } = CURRENCIES[currency];
  const n = new Intl.NumberFormat("fr-FR").format(amount);
  return symbol === "FCFA" || symbol === "FC" ? `${n} ${symbol}` : `${symbol}${n}`;
}

/** Shortcut: an FCFA base price shown in a country's currency. */
export function priceIn(amountXof: number, country: CountryCode | null | undefined): string {
  const c = countryOf(country);
  return formatMoney(convertXof(amountXof, c.currency), c.currency);
}

/* ---------- Pay-as-you-go packs ---------- */
export interface UsagePack {
  id: string;
  name: string;
  pitch: string;
  priceXof: number;
  credits: number;
  /** Days before unused credits expire; undefined = never. */
  validityDays?: number;
  popular?: boolean;
}

/** Sold without subscription: many merchants manage cash day to day. 1 visual = 10 credits. */
export const USAGE_PACKS: UsagePack[] = [
  { id: "pack_decouverte", name: "Pack Découverte", pitch: "1 photo produit + 1 portrait", priceXof: 1000, credits: 50 },
  { id: "pack_boutique", name: "Pack Boutique", pitch: "4 photos produit", priceXof: 3500, credits: 200, popular: true },
  { id: "pack_pro", name: "Pack Pro", pitch: "9 photos produit ou 6 vidéos de 5 s", priceXof: 5000, credits: 400 },
];

/** Bigger one-off top-ups for regular users (credits never expire). */
export const TOP_UP_PACKS: UsagePack[] = [
  { id: "topup_1500", name: "Recharge 1 500", pitch: "+10 % offerts", priceXof: 19900, credits: 1650 },
  { id: "topup_5000", name: "Recharge 5 000", pitch: "+20 % offerts", priceXof: 54900, credits: 6000 },
];

/* ---------- WhatsApp ---------- */
/** wa.me link with a pre-filled message. `phone` may contain spaces, "+" or dashes. */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Sokozia's own WhatsApp line (ambassadors, support). Replace with the real number before launch. */
export const SOKOZIA_WHATSAPP = "+225 00 00 00 00 00";

/* ---------- Local promo calendar ---------- */
export interface PromoMoment {
  id: string;
  name: string;
  /** ISO date (yyyy-mm-dd). Religious dates are estimates and shift by a day or two with the moon. */
  date: string;
  pitch: string;
  sectors: string[];
  templateIds: string[];
}

export const PROMO_MOMENTS: PromoMoment[] = [
  { id: "noel-2026", name: "Noël & fêtes de fin d'année", date: "2026-12-25", pitch: "Idées cadeaux, tenues de fête, menus de réveillon.", sectors: ["Couture & wax", "Cosmétiques", "Alimentation"], templateIds: ["tpl_10", "tpl_7"] },
  { id: "ramadan-2027", name: "Début du Ramadan", date: "2027-02-08", pitch: "Dattes, repas de rupture, tenues et parfums.", sectors: ["Alimentation", "Restauration"], templateIds: ["tpl_11", "tpl_6"] },
  { id: "korite-2027", name: "Korité (Aïd el-Fitr)", date: "2027-03-10", pitch: "Tenues, coiffures, bijoux : la semaine qui fait le chiffre.", sectors: ["Couture & wax", "Coiffure"], templateIds: ["tpl_24", "tpl_12"] },
  { id: "fete-meres-2027", name: "Fête des mères", date: "2027-05-30", pitch: "Coffrets beauté, bijoux, pagnes et bons cadeaux.", sectors: ["Cosmétiques", "Couture & wax"], templateIds: ["tpl_7", "tpl_5"] },
  { id: "tabaski-2027", name: "Tabaski (Aïd el-Kébir)", date: "2027-05-17", pitch: "Boubous, bazin, moutons, électroménager : anticipez de 3 semaines.", sectors: ["Couture & wax", "Alimentation", "Électronique"], templateIds: ["tpl_1", "tpl_9"] },
  { id: "rentree-2027", name: "Rentrée scolaire", date: "2027-09-20", pitch: "Fournitures, uniformes, téléphones et tablettes.", sectors: ["Électronique", "Couture & wax"], templateIds: ["tpl_8", "tpl_3"] },
];

/** Upcoming moments first, starting from `from`. */
export function upcomingMoments(from = new Date()): (PromoMoment & { daysLeft: number })[] {
  const day = 86_400_000;
  return PROMO_MOMENTS.map((m) => ({ ...m, daysLeft: Math.ceil((new Date(m.date).getTime() - from.getTime()) / day) }))
    .filter((m) => m.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
