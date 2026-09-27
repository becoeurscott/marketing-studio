"use client";

import {
  Bell, Building2, Check, CreditCard, ExternalLink, Globe2, KeyRound, LifeBuoy, Monitor, Palette, RotateCcw,
  Shield, Smartphone, Sparkles, User as UserIcon, Users, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { industryLabel, toneLabel } from "@/components/account/BrandEditModal";
import { ConfirmModal } from "@/components/account/ConfirmModal";
import { Toggle } from "@/components/account/Toggle";
import { useMoney } from "@/components/account/PaymentMethodPicker";
import { PageHeader } from "@/components/shell/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { plans } from "@/data";
import { delay } from "@/lib/api";
import { COUNTRIES, CURRENCIES, LANGUAGES, PAYMENT_METHODS, countryOf, type CountryCode, type LanguageId } from "@/lib/market";
import { selectCountry, selectCurrentBrand, useStore } from "@/lib/store";
import { IMAGE_STYLES, RATIOS, type AspectRatio, type ImageStyle } from "@/lib/types";
import { avatar, cn, formatDate, formatNumber } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = { owner: "Propriétaire", admin: "Admin", editor: "Éditeur", viewer: "Lecteur" };

const STYLE_LABELS: Record<string, string> = {
  "Product Photography": "Photo produit", Luxury: "Luxe", Minimal: "Minimaliste", Street: "Street", Lifestyle: "Lifestyle", Editorial: "Éditorial",
  Cinematic: "Cinématique", UGC: "UGC", Studio: "Studio", Fashion: "Mode", Food: "Culinaire", Tech: "Tech",
};

type SectionId = "account" | "market" | "workspace" | "notifications" | "appearance" | "brand" | "subscription" | "security" | "help";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; description: string }[] = [
  { id: "account", label: "Compte", icon: UserIcon, description: "Votre nom, votre e-mail et votre avatar." },
  { id: "market", label: "Pays et langues", icon: Globe2, description: "Monnaie, Mobile Money, langues et mode économie de data." },
  { id: "workspace", label: "Espace de travail", icon: Building2, description: "Nom de l’espace de travail et équipe." },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Ce dont nous vous informons, et où." },
  { id: "appearance", label: "Apparence", icon: Palette, description: "Thème, animations et réglages par défaut du Studio." },
  { id: "brand", label: "Marque", icon: Sparkles, description: "Kit de marque actif et ton de marque." },
  { id: "subscription", label: "Abonnement", icon: CreditCard, description: "Forfait, crédits et facturation." },
  { id: "security", label: "Sécurité", icon: Shield, description: "Mot de passe, double authentification et sessions." },
  { id: "help", label: "Aide", icon: LifeBuoy, description: "Documentation, support et à propos." },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("account");
  const [resetting, setResetting] = useState(false);
  const reset = useStore((s) => s.reset);
  const router = useRouter();
  const toast = useToast();
  const current = SECTIONS.find((s) => s.id === section)!;

  const doReset = () => {
    reset();
    try { localStorage.removeItem("ms-store"); } catch { /* ignore */ }
    setResetting(false);
    toast.info("Données de démo réinitialisées", "Tout est revenu au contenu d’exemple.");
    router.replace("/onboarding");
  };

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Compte, espace de travail, notifications, apparence, marque, abonnement, sécurité et aide."
        actions={<Button variant="secondary" leftIcon={<RotateCcw className="size-4" />} onClick={() => setResetting(true)}>Réinitialiser la démo</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Section nav: vertical list on desktop, scrollable pill row on mobile */}
        <nav aria-label="Sections des paramètres" className="lg:sticky lg:top-4 -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto no-scrollbar">
          <ul className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            {SECTIONS.map((s) => {
              const active = s.id === section;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 w-full rounded-md px-3 h-9 text-[13px] font-medium transition-colors whitespace-nowrap",
                      active ? "bg-elevated text-text" : "text-text2 hover:text-text hover:bg-surface",
                    )}
                  >
                    <s.icon className={cn("size-4", active ? "text-highlight" : "text-muted")} />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          <div className="mb-1">
            <h2 className="text-lg font-semibold tracking-tight">{current.label}</h2>
            <p className="text-[13px] text-text2">{current.description}</p>
          </div>
          {section === "account" && <AccountSection />}
          {section === "market" && <MarketSection />}
          {section === "workspace" && <WorkspaceSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "brand" && <BrandSection />}
          {section === "subscription" && <SubscriptionSection />}
          {section === "security" && <SecuritySection />}
          {section === "help" && <HelpSection />}

          <Card className="border-danger/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Réinitialiser les données de démo</p>
                <p className="text-[13px] text-text2">Rétablit le contenu d’exemple pour les projets, ressources, campagnes, marque, crédits et préférences sur cet appareil.</p>
              </div>
              <Button variant="danger" leftIcon={<RotateCcw className="size-4" />} onClick={() => setResetting(true)}>Réinitialiser</Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={doReset}
        danger
        title="Réinitialiser les données de démo ?"
        description="Toutes les modifications effectuées sur cet appareil seront perdues et vous repasserez par l’onboarding."
        confirmLabel="Tout réinitialiser"
      />
    </>
  );
}

/* ---------- Account ---------- */

function AccountSection() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company);
  const [role, setRole] = useState(user.role);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [error, setError] = useState("");

  const dirty = name !== user.name || email !== user.email || company !== user.company || role !== user.role || avatarUrl !== user.avatarUrl;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est obligatoire."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Saisissez une adresse e-mail valide."); return; }
    setError("");
    updateUser({ name: name.trim(), email: email.trim(), company: company.trim(), role: role.trim(), avatarUrl });
    toast.success("Compte mis à jour");
  };

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader title="Profil" subtitle="Affiché dans votre espace de travail et dans les campagnes partagées." />
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={avatarUrl} name={name || "?"} size={64} />
          <div>
            <p className="text-[13px] text-text2 mb-1.5">Choisissez un avatar</p>
            <div className="flex flex-wrap gap-2">
              {[12, 47, 33, 20, 5, 58].map((n) => (
                <button key={n} type="button" onClick={() => setAvatarUrl(avatar(n))} aria-label={`Choisir l’avatar ${n}`} aria-pressed={avatarUrl === avatar(n)} className="rounded-full ring-2 ring-transparent aria-pressed:ring-accent">
                  <Avatar src={avatar(n)} name="" size={32} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom complet" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error && !name.trim() ? error : undefined} />
          <Input label="E-mail" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error && name.trim() ? error : undefined} />
          <Input label="Entreprise" name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input label="Poste" name="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Fondateur" />
        </div>
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
          <p className="text-[12px] text-muted">Membre depuis le {formatDate(user.createdAt)} · <Link href="/profile" className="text-text2 hover:text-text underline-offset-2 hover:underline">Voir le profil</Link></p>
          <Button type="submit" disabled={!dirty}>Enregistrer les modifications</Button>
        </div>
      </Card>
    </form>
  );
}

/* ---------- Workspace ---------- */

function WorkspaceSection() {
  const workspaceName = useStore((s) => s.workspaceName);
  const setWorkspaceName = useStore((s) => s.setWorkspaceName);
  const members = useStore((s) => s.members);
  const plan = useStore((s) => s.plan);
  const toast = useToast();
  const [draft, setDraft] = useState(workspaceName);
  const planInfo = plans.find((p) => p.id === plan);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setWorkspaceName(v);
    toast.success("Espace de travail renommé", v);
  };

  return (
    <>
      <form onSubmit={save}>
        <Card>
          <CardHeader title="Nom de l’espace de travail" subtitle="Affiché dans la barre latérale et sur les invitations." />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input label="Nom" name="workspaceName" value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={!draft.trim() || draft.trim() === workspaceName}>Enregistrer</Button>
          </div>
        </Card>
      </form>
      <Card>
        <CardHeader
          title="Équipe"
          subtitle={`${members.length} membre${members.length > 1 ? "s" : ""} · ${planInfo?.features.teamMembers ?? ""} inclus dans votre forfait`}
          action={<Link href="/workspace"><Button size="sm" variant="secondary" leftIcon={<Users className="size-4" />}>Gérer l’équipe</Button></Link>}
        />
        <ul className="divide-y divide-border">
          {members.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar src={m.avatarUrl} name={m.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-[12px] text-muted truncate">{m.email}</p>
              </div>
              <Badge tone={m.role === "owner" ? "accent" : "neutral"}>{ROLE_LABELS[m.role] ?? m.role}</Badge>
              {m.status === "invited" && <Badge tone="warning">Invité</Badge>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ---------- Notifications ---------- */

const NOTIFY_KINDS = [
  { id: "generation", label: "Génération terminée", description: "Rendu terminé pour vos images, vidéos, publicités et textes." },
  { id: "campaign", label: "Campagne prête", description: "La création d’une campagne est terminée." },
  { id: "export", label: "Export terminé", description: "Votre export est prêt à être téléchargé." },
  { id: "credits", label: "Crédits faibles", description: "Me prévenir quand il me reste moins de 200 crédits." },
  { id: "template", label: "Nouveaux modèles", description: "Récapitulatif hebdomadaire des nouveaux modèles." },
  { id: "share", label: "Projet partagé", description: "Quelqu’un a partagé un projet avec vous." },
] as const;

function NotificationsSection() {
  const prefs = useStore((s) => s.preferences);
  const setPreference = useStore((s) => s.setPreference);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const toast = useToast();
  const [kinds, setKinds] = useState<Record<string, boolean>>(() => Object.fromEntries(NOTIFY_KINDS.map((k) => [k.id, true])));
  const channelsOff = !prefs.emailNotifications && !prefs.pushNotifications;

  return (
    <>
      <Card>
        <CardHeader title="Canaux" subtitle="Où vos notifications sont envoyées. Les notifications dans l’application restent toujours actives." />
        <Toggle label="E-mail" description="Recevoir une copie des notifications importantes dans votre boîte mail." checked={prefs.emailNotifications} onChange={(v) => setPreference("emailNotifications", v)} />
        <Toggle label="Push" description="Notifications push du navigateur lorsque Sokozia est fermé." checked={prefs.pushNotifications} onChange={(v) => setPreference("pushNotifications", v)} className="border-t border-border" />
      </Card>
      <Card className={cn(channelsOff && "opacity-60")}>
        <CardHeader title="Me notifier pour" subtitle={channelsOff ? "Activez un canal ci-dessus pour les recevoir en dehors de l’application." : "Choisissez les événements qui vous sont envoyés par e-mail ou push."} />
        {NOTIFY_KINDS.map((k, i) => (
          <Toggle key={k.id} label={k.label} description={k.description} checked={kinds[k.id]} onChange={(v) => setKinds((s) => ({ ...s, [k.id]: v }))} className={cn(i > 0 && "border-t border-border")} />
        ))}
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Boîte de réception</p>
            <p className="text-[13px] text-text2">{unread === 0 ? "Vous êtes à jour." : `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}.`}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={unread === 0} onClick={() => { markAll(); toast.success("Toutes les notifications sont marquées comme lues"); }}>Tout marquer comme lu</Button>
            <Link href="/notifications"><Button size="sm" variant="secondary">Ouvrir la boîte de réception</Button></Link>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ---------- Appearance ---------- */

function AppearanceSection() {
  const prefs = useStore((s) => s.preferences);
  const setPreference = useStore((s) => s.setPreference);
  const { setSidebarCollapsed } = useShell();

  return (
    <>
      <Card>
        <CardHeader title="Thème" subtitle="Sokozia est conçu comme un espace créatif sombre." />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: "dark", label: "Sombre", available: true },
            { id: "light", label: "Clair", available: false },
            { id: "system", label: "Système", available: false },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!t.available}
              aria-pressed={t.id === "dark"}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                t.id === "dark" ? "border-accent bg-accent/10" : "border-border bg-surface",
                !t.available && "opacity-50 cursor-not-allowed",
              )}
            >
              <div className={cn("h-14 rounded-md border border-border mb-2 overflow-hidden", t.id === "light" ? "bg-white" : "bg-bg")}>
                <div className={cn("h-3 w-full", t.id === "light" ? "bg-black/5" : "bg-white/5")} />
                <div className="p-1.5 flex gap-1">
                  <div className={cn("h-6 w-6 rounded-xs", t.id === "light" ? "bg-black/10" : "bg-white/10")} />
                  <div className={cn("h-6 flex-1 rounded-xs", t.id === "light" ? "bg-black/5" : "bg-white/5")} />
                </div>
              </div>
              <p className="text-[13px] font-medium flex items-center justify-between">{t.label}{t.id === "dark" && <Check className="size-3.5 text-highlight" />}</p>
              {!t.available && <p className="text-[11px] text-muted">Bientôt disponible</p>}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Interface" />
        <Toggle label="Barre latérale compacte" description="Réduire la barre latérale aux icônes sur ordinateur." checked={prefs.compactSidebar} onChange={(v) => { setPreference("compactSidebar", v); setSidebarCollapsed(v); }} />
        <Toggle label="Réduire les animations" description="Limiter les animations et transitions dans toute l’application." checked={prefs.reducedMotion} onChange={(v) => setPreference("reducedMotion", v)} className="border-t border-border" />
      </Card>
      <Card>
        <CardHeader title="Réglages par défaut du Studio" subtitle="Présélectionnés lorsque vous lancez une nouvelle génération." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Format par défaut" name="defaultRatio" value={prefs.defaultRatio} onChange={(e) => setPreference("defaultRatio", e.target.value as AspectRatio)} options={RATIOS.map((r) => ({ value: r, label: r }))} />
          <Select label="Style par défaut" name="defaultStyle" value={prefs.defaultStyle} onChange={(e) => setPreference("defaultStyle", e.target.value as ImageStyle)} options={IMAGE_STYLES.map((s) => ({ value: s, label: STYLE_LABELS[s] ?? s }))} />
        </div>
      </Card>
    </>
  );
}

/* ---------- Market ---------- */

function MarketSection() {
  const country = useStore(selectCountry);
  const setCountry = useStore((s) => s.setCountry);
  const prefs = useStore((s) => s.preferences);
  const setPreference = useStore((s) => s.setPreference);
  const info = countryOf(country);
  const currency = CURRENCIES[info.currency];

  return (
    <>
      <Card>
        <CardHeader title="Pays" subtitle="Vos prix s’affichent dans votre monnaie et vous payez avec le Mobile Money de votre pays." />
        <Select label="Pays de vente" name="country" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-[13px]">
          <div className="rounded-md border border-border bg-surface p-3"><p className="text-muted text-[12px]">Monnaie</p><p className="font-medium mt-0.5">{currency.label} ({currency.symbol})</p></div>
          <div className="rounded-md border border-border bg-surface p-3"><p className="text-muted text-[12px]">Paiements acceptés</p><p className="font-medium mt-0.5">{info.payments.map((m) => PAYMENT_METHODS[m].label).join(", ")}</p></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Langue des textes et voix off" subtitle="Langue proposée par défaut dans le rédacteur, les notes vocales et les vidéos UGC." />
        <Select label="Langue par défaut" name="language" value={prefs.language ?? info.languages[0]} onChange={(e) => setPreference("language", e.target.value as LanguageId)} options={LANGUAGES.map((l) => ({ value: l.id, label: `${l.label}${info.languages.includes(l.id) ? " · parlée dans votre pays" : ""}` }))} />
      </Card>
      <Card>
        <CardHeader title="Téléphone et connexion" subtitle="Pensé pour les photos prises au téléphone et les forfaits data limités." />
        <Toggle label="Mode photo prise au téléphone" description="Détourage, lumière et netteté corrigés automatiquement, même avec une photo floue ou sombre." checked={prefs.phonePhotoMode ?? true} onChange={(v) => setPreference("phonePhotoMode", v)} />
        <Toggle label="Vidéos légères" description="Fichiers jusqu’à 4 fois plus petits, pour les connexions lentes et le partage sur WhatsApp." checked={prefs.lightVideos ?? true} onChange={(v) => setPreference("lightVideos", v)} className="border-t border-border" />
      </Card>
    </>
  );
}

/* ---------- Brand ---------- */

function BrandSection() {
  const brands = useStore((s) => s.brands);
  const brand = useStore(selectCurrentBrand);
  const setCurrentBrand = useStore((s) => s.setCurrentBrand);
  const toast = useToast();

  if (!brand) {
    return (
      <Card>
        <p className="text-sm text-text2">Aucun kit de marque pour le moment.</p>
        <Link href="/brand" className="inline-block mt-3"><Button size="sm">Créer un kit de marque</Button></Link>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader title="Marque active" subtitle="Utilisée pour les textes générés, les publicités et les exports." action={<Link href="/brand"><Button size="sm" variant="secondary" rightIcon={<ExternalLink className="size-3.5" />}>Modifier le kit de marque</Button></Link>} />
        <div className="flex items-center gap-4">
          <img src={brand.logoUrl} alt="" className="size-14 rounded-lg object-cover border border-border" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{brand.name}</p>
            <p className="text-[13px] text-text2 truncate">{brand.industry ? industryLabel(brand.industry) : "Aucun secteur"} · {brand.audience || "Aucune audience définie"}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {brand.colors.map((c) => <span key={c} className="size-4 rounded-full border border-border-strong" style={{ background: c }} title={c} />)}
              <span className="text-[12px] text-muted ml-1">{brand.fonts.heading} / {brand.fonts.body}</span>
            </div>
          </div>
        </div>
        {brands.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Select
              label="Changer de marque"
              name="brand"
              value={brand.id}
              onChange={(e) => { setCurrentBrand(e.target.value); toast.success("Marque changée", brands.find((b) => b.id === e.target.value)?.name); }}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Ton de marque" subtitle="Ton et style d’écriture appliqués aux textes générés." action={<Link href="/brand/voice"><Button size="sm" variant="secondary">Modifier le ton</Button></Link>} />
        <div className="flex flex-wrap gap-1.5 mb-2"><Badge tone="accent">{toneLabel(brand.voice.tone)}</Badge>{brand.voice.keywords.slice(0, 4).map((k) => <Badge key={k} tone="outline">{k}</Badge>)}</div>
        <p className="text-[13px] text-text2 italic">{brand.voice.writingStyle || "Aucun style d’écriture défini pour le moment."}</p>
      </Card>
    </>
  );
}

/* ---------- Subscription ---------- */

function SubscriptionSection() {
  const plan = useStore((s) => s.plan);
  const credits = useStore((s) => s.credits);
  const transactions = useStore((s) => s.transactions);
  const current = plans.find((p) => p.id === plan) ?? plans[1];
  const next = plans[plans.findIndex((p) => p.id === current.id) + 1];
  const money = useMoney();
  const payment = PAYMENT_METHODS[countryOf(useStore(selectCountry)).payments[0]];
  const renew = new Date(); renew.setMonth(renew.getMonth() + 1, 1);

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-text2">Forfait actuel</p>
            <p className="text-2xl font-bold tracking-tight">{current.name} <span className="text-base font-medium text-text2">{money(current.priceXof)}/mois</span></p>
            <p className="text-[12px] text-muted mt-1">Renouvellement le {formatDate(renew.toISOString())} · {formatNumber(current.credits)} crédits par mois</p>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing"><Button variant={next ? "primary" : "secondary"}>{next ? `Passer à ${next.name}` : "Gérer le forfait"}</Button></Link>
            <Link href="/pricing"><Button variant="ghost">Comparer les forfaits</Button></Link>
          </div>
        </div>
        <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-5 pt-4 border-t border-border text-[13px] text-text2">
          {Object.values(current.features).map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success shrink-0" />{f}</li>)}
        </ul>
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-text2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" /> Crédits</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{formatNumber(credits)}</p>
            <p className="text-[12px] text-muted">{transactions.length} transaction{transactions.length > 1 ? "s" : ""} dans l’historique</p>
          </div>
          <Link href="/credits"><Button variant="secondary">Acheter des crédits</Button></Link>
        </div>
      </Card>
      <Card>
        <CardHeader title="Facturation" subtitle="Moyen de paiement et factures (simulés)." />
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
          <div className="h-8 w-12 rounded-xs flex items-center justify-center text-[10px] font-bold tracking-wider text-black" style={{ background: payment.color }}>{payment.short}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{payment.label} · •• •• 42</p>
            <p className="text-[12px] text-muted">Confirmation sur votre téléphone · Par défaut</p>
          </div>
          <Badge tone="success" dot>Active</Badge>
        </div>
        <p className="text-[12px] text-muted mt-3">Les paiements sont simulés dans ce prototype. Aucun montant n’est débité.</p>
      </Card>
    </>
  );
}

/* ---------- Security ---------- */

function SecuritySection() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    { id: "s1", device: "Cet appareil · Chrome sur macOS", location: "New York, États-Unis", current: true, icon: Monitor },
    { id: "s2", device: "iPhone · application Sokozia", location: "New York, États-Unis", current: false, icon: Smartphone },
    { id: "s3", device: "Safari sur macOS", location: "Los Angeles, États-Unis", current: false, icon: Monitor },
  ]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!current) { setError("Saisissez votre mot de passe actuel."); return; }
    if (next.length < 8) { setError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (next !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setError("");
    setSaving(true);
    await delay(900);
    setSaving(false);
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Mot de passe mis à jour", "Utilisez votre nouveau mot de passe lors de votre prochaine connexion.");
  };

  return (
    <>
      <form onSubmit={changePassword}>
        <Card>
          <CardHeader title="Changer de mot de passe" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Mot de passe actuel" name="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <Input label="Nouveau mot de passe" name="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="Au moins 8 caractères." />
            <Input label="Confirmer le nouveau mot de passe" name="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs text-danger min-h-4">{error}</p>
            <Button type="submit" loading={saving} leftIcon={<KeyRound className="size-4" />}>Mettre à jour le mot de passe</Button>
          </div>
        </Card>
      </form>
      <Card>
        <CardHeader title="Double authentification" />
        <Toggle
          label="Application d’authentification"
          description={twoFactor ? "Activée. Un code vous sera demandé lors de la connexion sur un nouvel appareil." : "Ajoutez une seconde étape lors de la connexion."}
          checked={twoFactor}
          onChange={(v) => { setTwoFactor(v); toast.success(v ? "Double authentification activée" : "Double authentification désactivée"); }}
        />
      </Card>
      <Card>
        <CardHeader
          title="Sessions actives"
          action={sessions.length > 1 && <Button size="sm" variant="ghost" onClick={() => { setSessions((s) => s.filter((x) => x.current)); toast.success("Autres sessions déconnectées"); }}>Déconnecter les autres</Button>}
        />
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <s.icon className="size-4 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.device}</p>
                <p className="text-[12px] text-muted">{s.location}</p>
              </div>
              {s.current ? <Badge tone="success" dot>Actuelle</Badge> : (
                <Button size="sm" variant="ghost" onClick={() => { setSessions((list) => list.filter((x) => x.id !== s.id)); toast.success("Session déconnectée"); }}>Déconnecter</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ---------- Help ---------- */

function HelpSection() {
  const links = [
    { label: "Centre d’aide et FAQ", description: "Guides, raccourcis et réponses aux questions fréquentes.", href: "/help" },
    { label: "Contacter le support", description: "Envoyez-nous un message. Nous répondons sous 24 h.", href: "/help" },
    { label: "Crédits et tarifs", description: "Le fonctionnement des crédits et le contenu de chaque forfait.", href: "/pricing" },
  ];
  return (
    <>
      <Card padded={false}>
        <ul className="divide-y divide-border">
          {links.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.label}</p>
                  <p className="text-[13px] text-text2">{l.description}</p>
                </div>
                <ExternalLink className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="À propos" />
        <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
          <dt className="text-text2">Version</dt><dd>0.9.0 (prototype)</dd>
          <dt className="text-text2">Build</dt><dd>Next.js · frontend uniquement, API simulées</dd>
          <dt className="text-text2">Données</dt><dd>Stockées localement dans ce navigateur</dd>
        </dl>
      </Card>
    </>
  );
}
