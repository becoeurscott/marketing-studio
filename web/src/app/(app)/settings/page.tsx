"use client";

import {
  Bell, Building2, Camera, Check, CreditCard, ExternalLink, Globe2, KeyRound, LifeBuoy, LogOut, MessageCircle, Palette,
  Shield, Sparkles, User as UserIcon, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { signOut } from "@/app/(auth)/actions";
import { industryLabel, toneLabel } from "@/components/account/BrandEditModal";
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
import { uploadPhoto } from "@/lib/higgsfield/client";
import { imageModel } from "@/lib/higgsfield/models";
import { COUNTRIES, CURRENCIES, LANGUAGES, PAYMENT_METHODS, SOKOZIA_WHATSAPP, USAGE_PACKS, countryOf, whatsappLink, type CountryCode, type LanguageId } from "@/lib/market";
import { selectCountry, selectCurrentBrand, useStore } from "@/lib/store";
import { IMAGE_STYLES, RATIOS, type AspectRatio, type ImageStyle } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { accountDetails, changePassword, sendPasswordCode, updateProfile, type AccountDetails } from "./actions";

const STYLE_LABELS: Record<string, string> = {
  "Product Photography": "Photo produit", Luxury: "Luxe", Minimal: "Minimaliste", Street: "Street", Lifestyle: "Lifestyle", Editorial: "Éditorial",
  Cinematic: "Cinématique", UGC: "UGC", Studio: "Studio", Fashion: "Mode", Food: "Culinaire", Tech: "Tech",
};

type SectionId = "account" | "market" | "workspace" | "notifications" | "appearance" | "brand" | "credits" | "security" | "help";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; description: string }[] = [
  { id: "account", label: "Compte", icon: UserIcon, description: "Votre nom, votre photo et l’e-mail de connexion." },
  { id: "market", label: "Pays et langues", icon: Globe2, description: "Monnaie, Mobile Money, langues et mode économie de data." },
  { id: "workspace", label: "Boutique", icon: Building2, description: "Le nom de votre boutique ou de votre espace." },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Les alertes que vous recevez dans Sokozia." },
  { id: "appearance", label: "Apparence", icon: Palette, description: "Barre latérale, animations et réglages par défaut du Studio." },
  { id: "brand", label: "Marque", icon: Sparkles, description: "Kit de marque actif et ton de marque." },
  { id: "credits", label: "Crédits et paiement", icon: CreditCard, description: "Solde, historique et recharge." },
  { id: "security", label: "Sécurité", icon: Shield, description: "Mot de passe et connexion." },
  { id: "help", label: "Aide", icon: LifeBuoy, description: "Questions fréquentes, support et à propos." },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>("account");
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const current = SECTIONS.find((s) => s.id === section)!;

  useEffect(() => { void accountDetails().then(setAccount).catch(() => setAccount(null)); }, []);

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Compte, pays et langues, boutique, notifications, apparence, marque, crédits, sécurité et aide."
        actions={<form action={signOut}><Button type="submit" variant="secondary" leftIcon={<LogOut className="size-4" />}>Se déconnecter</Button></form>}
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
          {section === "account" && <AccountSection account={account} onSaved={setAccount} />}
          {section === "market" && <MarketSection />}
          {section === "workspace" && <WorkspaceSection account={account} />}
          {section === "notifications" && <NotificationsSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "brand" && <BrandSection />}
          {section === "credits" && <CreditsSection account={account} />}
          {section === "security" && <SecuritySection account={account} />}
          {section === "help" && <HelpSection />}
        </div>
      </div>
    </>
  );
}

/* ---------- Account ---------- */

function AccountSection({ account, onSaved }: { account: AccountDetails | null; onSaved: (a: AccountDetails) => void }) {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [role, setRole] = useState(user.role);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  // The account's real name/photo win over the local copy once loaded.
  useEffect(() => {
    if (!account) return;
    if (account.name && !user.name) setName(account.name);
    if (account.avatarUrl && !user.avatarUrl) setAvatarUrl(account.avatarUrl);
  }, [account, user.name, user.avatarUrl]);

  const dirty = name !== user.name || company !== user.company || role !== user.role || avatarUrl !== user.avatarUrl;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      setAvatarUrl(await uploadPhoto(file));
    } catch (e) {
      toast.error("Photo non importée", e instanceof Error ? e.message : "Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est obligatoire."); return; }
    setError("");
    startSaving(async () => {
      const res = await updateProfile({ name: name.trim(), avatarUrl });
      if (!res.ok) { toast.error("Profil non enregistré", res.error); return; }
      updateUser({ name: name.trim(), email: account?.email ?? user.email, company: company.trim(), role: role.trim(), avatarUrl });
      if (account) onSaved({ ...account, name: name.trim(), avatarUrl });
      toast.success("Compte mis à jour");
    });
  };

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader title="Profil" subtitle="Enregistré sur votre compte Sokozia : visible sur tous vos appareils." />
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={avatarUrl} name={name || "?"} size={64} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" loading={uploading} leftIcon={<Camera className="size-4" />} onClick={() => fileRef.current?.click()}>
              {avatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </Button>
            {avatarUrl && <Button type="button" size="sm" variant="ghost" onClick={() => setAvatarUrl("")}>Retirer</Button>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} aria-label="Choisir une photo de profil" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom complet" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error || undefined} />
          <Input label="E-mail de connexion" name="email" type="email" value={account?.email ?? user.email} readOnly disabled hint="L’e-mail de votre compte ne peut pas être modifié ici." />
          <Input label="Boutique ou entreprise" name="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. Chez Awa Couture" />
          <Input label="Activité" name="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex. Couturière, revendeur de téléphones" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
          <p className="text-[12px] text-muted">
            {account?.createdAt ? `Compte créé le ${formatDate(account.createdAt)}` : "Compte Sokozia"} · <Link href="/profile" className="text-text2 hover:text-text underline-offset-2 hover:underline">Voir le profil</Link>
          </p>
          <Button type="submit" loading={saving} disabled={!dirty || uploading}>Enregistrer les modifications</Button>
        </div>
      </Card>
    </form>
  );
}

/* ---------- Workspace (shop) ---------- */

function WorkspaceSection({ account }: { account: AccountDetails | null }) {
  const workspaceName = useStore((s) => s.workspaceName);
  const setWorkspaceName = useStore((s) => s.setWorkspaceName);
  const user = useStore((s) => s.user);
  const toast = useToast();
  const [draft, setDraft] = useState(workspaceName);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setWorkspaceName(v);
    toast.success("Nom enregistré", v);
  };

  return (
    <>
      <form onSubmit={save}>
        <Card>
          <CardHeader title="Nom de la boutique" subtitle="Affiché dans la barre latérale. Enregistré sur votre compte." />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input label="Nom" name="workspaceName" value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={!draft.trim() || draft.trim() === workspaceName}>Enregistrer</Button>
          </div>
        </Card>
      </form>
      <Card>
        <CardHeader title="Accès" subtitle="Votre espace est personnel : vous seul y avez accès." />
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.name || account?.email || "?"} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "Vous"}</p>
            <p className="text-[12px] text-muted truncate">{account?.email ?? user.email}</p>
          </div>
          <Badge tone="accent">Propriétaire</Badge>
        </div>
        <p className="text-[12px] text-muted mt-3">Le partage avec des collaborateurs (vendeuses, agence) arrivera plus tard.</p>
      </Card>
    </>
  );
}

/* ---------- Notifications ---------- */

function NotificationsSection() {
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const total = useStore((s) => s.notifications.length);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const toast = useToast();

  return (
    <>
      <Card>
        <CardHeader title="Dans Sokozia" subtitle="Vous êtes prévenu ici (cloche en haut) quand :" />
        <ul className="space-y-2 text-[13px] text-text2">
          {["Une image, une vidéo ou une pub est prête", "Une campagne est créée", "Un export est prêt à partager"].map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="size-3.5 text-success shrink-0" />{t}</li>
          ))}
        </ul>
        <p className="text-[12px] text-muted mt-3">Les alertes par e-mail et sur téléphone arriveront avec l’application mobile.</p>
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Boîte de réception</p>
            <p className="text-[13px] text-text2">{total === 0 ? "Aucune notification pour l’instant." : unread === 0 ? "Vous êtes à jour." : `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}.`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
  const { setSidebarCollapsed, sidebarLocked } = useShell();

  return (
    <>
      <Card>
        <CardHeader title="Interface" subtitle="Sokozia utilise un thème sombre, pensé pour mettre vos visuels en valeur." />
        <Toggle
          label="Barre latérale compacte"
          description={sidebarLocked ? "S’applique sur les grands écrans (la barre est déjà réduite sur cet écran)." : "Réduire la barre latérale aux icônes."}
          checked={prefs.compactSidebar ?? false}
          onChange={(v) => setSidebarCollapsed(v)}
        />
        <Toggle label="Réduire les animations" description="Coupe les animations et transitions dans toute l’application." checked={prefs.reducedMotion ?? false} onChange={(v) => setPreference("reducedMotion", v)} className="border-t border-border" />
      </Card>
      <Card>
        <CardHeader title="Réglages par défaut du Studio" subtitle="Présélectionnés quand vous ouvrez le générateur d’images." />
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
        <CardHeader title="Pays" subtitle="Vos prix s’affichent dans votre monnaie, avec les moyens de paiement de votre pays." />
        <Select label="Pays de vente" name="country" value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} options={COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-[13px]">
          <div className="rounded-md border border-border bg-surface p-3"><p className="text-muted text-[12px]">Monnaie</p><p className="font-medium mt-0.5">{currency.label} ({currency.symbol})</p></div>
          <div className="rounded-md border border-border bg-surface p-3"><p className="text-muted text-[12px]">Moyens de paiement</p><p className="font-medium mt-0.5">{info.payments.map((m) => PAYMENT_METHODS[m].label).join(", ")}</p></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Langue des textes et voix off" subtitle="Langue proposée par défaut dans le rédacteur, les notes vocales et les vidéos UGC." />
        <Select label="Langue par défaut" name="language" value={prefs.language ?? info.languages[0]} onChange={(e) => setPreference("language", e.target.value as LanguageId)} options={LANGUAGES.map((l) => ({ value: l.id, label: `${l.label}${info.languages.includes(l.id) ? " · parlée dans votre pays" : ""}` }))} />
      </Card>
      <Card>
        <CardHeader title="Téléphone et connexion" subtitle="Pensé pour les photos prises au téléphone et les forfaits data limités." />
        <Toggle label="Mode photo prise au téléphone" description="Sokozia demande au modèle de détourer le produit et de corriger la lumière et la netteté de votre photo." checked={prefs.phonePhotoMode ?? true} onChange={(v) => setPreference("phonePhotoMode", v)} />
        <Toggle label="Vidéos légères" description="Vidéos en 480p, plus rapides à générer et à envoyer sur WhatsApp." checked={prefs.lightVideos ?? true} onChange={(v) => setPreference("lightVideos", v)} className="border-t border-border" />
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
        <CardHeader title="Marque active" subtitle="Utilisée pour les textes générés et les publicités." action={<Link href="/brand"><Button size="sm" variant="secondary" rightIcon={<ExternalLink className="size-3.5" />}>Modifier le kit de marque</Button></Link>} />
        <div className="flex items-center gap-4">
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt="" className="size-14 rounded-lg object-cover border border-border" />
            : <Avatar name={brand.name} size={56} />}
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

/* ---------- Credits & payment ---------- */

function CreditsSection({ account }: { account: AccountDetails | null }) {
  const credits = useStore((s) => s.credits);
  const transactions = useStore((s) => s.transactions);
  const country = useStore(selectCountry);
  const user = useStore((s) => s.user);
  const money = useMoney();
  const info = countryOf(country);
  const mobile = info.payments.filter((m) => PAYMENT_METHODS[m].mobile).map((m) => PAYMENT_METHODS[m].label);
  const email = account?.email ?? user.email;

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-text2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" /> Crédits disponibles</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{formatNumber(credits)}</p>
            <p className="text-[12px] text-muted">Sans abonnement · {transactions.length} opération{transactions.length > 1 ? "s" : ""} dans l’historique</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/credits"><Button>Recharger</Button></Link>
            <Link href="/credits"><Button variant="ghost">Voir l’historique</Button></Link>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Packs" subtitle={`Payez seulement ce que vous utilisez. 1 photo produit Standard = ${imageModel("marketing-studio-1k").credits} crédits, 1 image Éco = ${imageModel("soul-2").credits} crédits.`} />
        <ul className="divide-y divide-border">
          {USAGE_PACKS.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.name} {p.popular && <Badge tone="accent">Le plus pris</Badge>}</p>
                <p className="text-[12px] text-muted">{formatNumber(p.credits)} crédits · {p.pitch}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{money(p.priceXof)}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Paiement" subtitle={`Mobile Money dans votre pays : ${mobile.join(", ") || "carte bancaire"}.`} />
        <p className="text-[13px] text-text2">Le paiement Mobile Money directement dans Sokozia arrive bientôt. En attendant, écrivez-nous sur WhatsApp : nous rechargeons votre compte dès réception du paiement.</p>
        <a
          href={whatsappLink(SOKOZIA_WHATSAPP, `Bonjour Sokozia, je veux recharger des crédits pour le compte ${email}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3"
        >
          <Button variant="secondary" leftIcon={<MessageCircle className="size-4" />}>Recharger via WhatsApp</Button>
        </a>
      </Card>
    </>
  );
}

/* ---------- Security ---------- */

function SecuritySection({ account }: { account: AccountDetails | null }) {
  const toast = useToast();
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const sendCode = () => {
    setError("");
    startTransition(async () => {
      const res = await sendPasswordCode();
      if (!res.ok) { setError(res.error ?? "Envoi impossible."); return; }
      setStep("code");
      toast.success("Code envoyé", `Un code à 6 chiffres a été envoyé à ${res.email}.`);
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) { setError("Entrez le code à 6 chiffres reçu par e-mail."); return; }
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setError("");
    startTransition(async () => {
      const res = await changePassword({ code, password });
      if (!res.ok) { setError(res.error ?? "Échec."); return; }
      setStep("idle"); setCode(""); setPassword(""); setConfirm("");
      toast.success("Mot de passe modifié", "Utilisez-le à votre prochaine connexion.");
    });
  };

  return (
    <>
      <Card>
        <CardHeader title="Mot de passe" subtitle={`Par sécurité, on vous envoie d’abord un code à ${account?.email ?? "votre e-mail"}. Marche aussi si vous vous connectez avec Google ou par code.`} />
        {step === "idle" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-danger min-h-4">{error}</p>
            <Button loading={pending} leftIcon={<KeyRound className="size-4" />} onClick={sendCode}>Recevoir un code</Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Input label="Code reçu par e-mail" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              <Input label="Nouveau mot de passe" name="newPassword" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Au moins 6 caractères." />
              <Input label="Confirmer" name="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-xs text-danger min-h-4">{error}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" disabled={pending} onClick={sendCode}>Renvoyer le code</Button>
                <Button type="submit" loading={pending} leftIcon={<KeyRound className="size-4" />}>Changer le mot de passe</Button>
              </div>
            </div>
          </form>
        )}
      </Card>
      <Card>
        <CardHeader title="Connexion" subtitle="Vous êtes connecté sur cet appareil." />
        <form action={signOut} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-text2">Sur un appareil partagé, pensez à vous déconnecter. Vos créations et vos crédits restent sur votre compte.</p>
          <Button type="submit" variant="danger" leftIcon={<LogOut className="size-4" />}>Se déconnecter</Button>
        </form>
      </Card>
    </>
  );
}

/* ---------- Help ---------- */

function HelpSection() {
  const links = [
    { label: "Centre d’aide et FAQ", description: "Guides et réponses aux questions fréquentes.", href: "/help", external: false },
    { label: "Écrire au support sur WhatsApp", description: "Questions, recharges, problèmes : on vous répond sur WhatsApp.", href: whatsappLink(SOKOZIA_WHATSAPP, "Bonjour Sokozia, "), external: true },
    { label: "Crédits et tarifs", description: "Le fonctionnement des crédits et le prix des packs.", href: "/pricing", external: false },
  ];
  return (
    <>
      <Card padded={false}>
        <ul className="divide-y divide-border">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.label}</p>
                  <p className="text-[13px] text-text2">{l.description}</p>
                </div>
                <ExternalLink className="size-4 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="À propos" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
          <dt className="text-text2">Application</dt><dd>Sokozia (bêta)</dd>
          <dt className="text-text2">Qualités</dt><dd>Images Éco, Standard et HD · vidéos Éco, Rapide, Standard, Premium, Ultra HD et Cinéma</dd>
          <dt className="text-text2">Vos données</dt><dd>Enregistrées sur votre compte Sokozia, disponibles sur tous vos appareils</dd>
        </dl>
      </Card>
    </>
  );
}
