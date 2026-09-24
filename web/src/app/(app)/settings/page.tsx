"use client";

import {
  Bell, Building2, Check, CreditCard, ExternalLink, KeyRound, LifeBuoy, Monitor, Palette, RotateCcw,
  Shield, Smartphone, Sparkles, User as UserIcon, Users, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConfirmModal } from "@/components/account/ConfirmModal";
import { Toggle } from "@/components/account/Toggle";
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
import { selectCurrentBrand, useStore } from "@/lib/store";
import { IMAGE_STYLES, RATIOS, type AspectRatio, type ImageStyle } from "@/lib/types";
import { avatar, cn, formatDate, formatNumber } from "@/lib/utils";

type SectionId = "account" | "workspace" | "notifications" | "appearance" | "brand" | "subscription" | "security" | "help";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; description: string }[] = [
  { id: "account", label: "Account", icon: UserIcon, description: "Your name, email and avatar." },
  { id: "workspace", label: "Workspace", icon: Building2, description: "Workspace name and team." },
  { id: "notifications", label: "Notifications", icon: Bell, description: "What we tell you about, and where." },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, motion and Studio defaults." },
  { id: "brand", label: "Brand", icon: Sparkles, description: "Active brand kit and voice." },
  { id: "subscription", label: "Subscription", icon: CreditCard, description: "Plan, credits and billing." },
  { id: "security", label: "Security", icon: Shield, description: "Password, two-factor and sessions." },
  { id: "help", label: "Help", icon: LifeBuoy, description: "Docs, support and about." },
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
    toast.info("Demo data reset", "Everything is back to the sample content.");
    router.replace("/onboarding");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account, workspace, notifications, appearance, brand, subscription, security and help."
        actions={<Button variant="secondary" leftIcon={<RotateCcw className="size-4" />} onClick={() => setResetting(true)}>Reset demo data</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Section nav: vertical list on desktop, scrollable pill row on mobile */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-4 -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto no-scrollbar">
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
                <p className="text-sm font-medium">Reset demo data</p>
                <p className="text-[13px] text-text2">Returns projects, assets, campaigns, brand, credits and preferences on this device to the sample content.</p>
              </div>
              <Button variant="danger" leftIcon={<RotateCcw className="size-4" />} onClick={() => setResetting(true)}>Reset</Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={doReset}
        danger
        title="Reset demo data?"
        description="All changes on this device will be lost and you'll go through onboarding again."
        confirmLabel="Reset everything"
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
    if (!name.trim()) { setError("Name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    setError("");
    updateUser({ name: name.trim(), email: email.trim(), company: company.trim(), role: role.trim(), avatarUrl });
    toast.success("Account updated");
  };

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader title="Profile" subtitle="Shown on your workspace and in shared campaigns." />
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={avatarUrl} name={name || "?"} size={64} />
          <div>
            <p className="text-[13px] text-text2 mb-1.5">Choose an avatar</p>
            <div className="flex flex-wrap gap-2">
              {[12, 47, 33, 20, 5, 58].map((n) => (
                <button key={n} type="button" onClick={() => setAvatarUrl(avatar(n))} aria-label={`Choose avatar ${n}`} aria-pressed={avatarUrl === avatar(n)} className="rounded-full ring-2 ring-transparent aria-pressed:ring-accent">
                  <Avatar src={avatar(n)} name="" size={32} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error && !name.trim() ? error : undefined} />
          <Input label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error && name.trim() ? error : undefined} />
          <Input label="Company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input label="Role" name="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Founder" />
        </div>
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
          <p className="text-[12px] text-muted">Member since {formatDate(user.createdAt)} · <Link href="/profile" className="text-text2 hover:text-text underline-offset-2 hover:underline">View profile</Link></p>
          <Button type="submit" disabled={!dirty}>Save changes</Button>
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
    toast.success("Workspace renamed", v);
  };

  return (
    <>
      <form onSubmit={save}>
        <Card>
          <CardHeader title="Workspace name" subtitle="Appears in the sidebar and on invites." />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input label="Name" name="workspaceName" value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={!draft.trim() || draft.trim() === workspaceName}>Save</Button>
          </div>
        </Card>
      </form>
      <Card>
        <CardHeader
          title="Team"
          subtitle={`${members.length} member${members.length === 1 ? "" : "s"} · ${planInfo?.features.teamMembers ?? ""} on your plan`}
          action={<Link href="/workspace"><Button size="sm" variant="secondary" leftIcon={<Users className="size-4" />}>Manage team</Button></Link>}
        />
        <ul className="divide-y divide-border">
          {members.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar src={m.avatarUrl} name={m.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-[12px] text-muted truncate">{m.email}</p>
              </div>
              <Badge tone={m.role === "owner" ? "accent" : "neutral"} className="capitalize">{m.role}</Badge>
              {m.status === "invited" && <Badge tone="warning">Invited</Badge>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ---------- Notifications ---------- */

const NOTIFY_KINDS = [
  { id: "generation", label: "Generation complete", description: "Images, videos, ads and copy finished rendering." },
  { id: "campaign", label: "Campaign ready", description: "A campaign has finished building." },
  { id: "export", label: "Export complete", description: "Your export is ready to download." },
  { id: "credits", label: "Credits low", description: "Warn me when credits drop under 200." },
  { id: "template", label: "New templates", description: "Weekly digest of new templates." },
  { id: "share", label: "Project shared", description: "Someone shared a project with you." },
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
        <CardHeader title="Channels" subtitle="Where notifications are delivered. In-app notifications are always on." />
        <Toggle label="Email" description="Send a copy of important notifications to your inbox." checked={prefs.emailNotifications} onChange={(v) => setPreference("emailNotifications", v)} />
        <Toggle label="Push" description="Browser push notifications while Marketing Studio is closed." checked={prefs.pushNotifications} onChange={(v) => setPreference("pushNotifications", v)} className="border-t border-border" />
      </Card>
      <Card className={cn(channelsOff && "opacity-60")}>
        <CardHeader title="Notify me about" subtitle={channelsOff ? "Turn on a channel above to receive these outside the app." : "Choose which events reach you by email or push."} />
        {NOTIFY_KINDS.map((k, i) => (
          <Toggle key={k.id} label={k.label} description={k.description} checked={kinds[k.id]} onChange={(v) => setKinds((s) => ({ ...s, [k.id]: v }))} className={cn(i > 0 && "border-t border-border")} />
        ))}
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Inbox</p>
            <p className="text-[13px] text-text2">{unread === 0 ? "You're all caught up." : `${unread} unread notification${unread === 1 ? "" : "s"}.`}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={unread === 0} onClick={() => { markAll(); toast.success("All notifications marked as read"); }}>Mark all read</Button>
            <Link href="/notifications"><Button size="sm" variant="secondary">Open inbox</Button></Link>
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
        <CardHeader title="Theme" subtitle="Marketing Studio is designed as a dark creative workspace." />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: "dark", label: "Dark", available: true },
            { id: "light", label: "Light", available: false },
            { id: "system", label: "System", available: false },
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
              {!t.available && <p className="text-[11px] text-muted">Coming soon</p>}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Interface" />
        <Toggle label="Compact sidebar" description="Collapse the sidebar to icons on desktop." checked={prefs.compactSidebar} onChange={(v) => { setPreference("compactSidebar", v); setSidebarCollapsed(v); }} />
        <Toggle label="Reduce motion" description="Minimise animations and transitions across the app." checked={prefs.reducedMotion} onChange={(v) => setPreference("reducedMotion", v)} className="border-t border-border" />
      </Card>
      <Card>
        <CardHeader title="Studio defaults" subtitle="Pre-selected when you start a new generation." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Default aspect ratio" name="defaultRatio" value={prefs.defaultRatio} onChange={(e) => setPreference("defaultRatio", e.target.value as AspectRatio)} options={RATIOS.map((r) => ({ value: r, label: r }))} />
          <Select label="Default style" name="defaultStyle" value={prefs.defaultStyle} onChange={(e) => setPreference("defaultStyle", e.target.value as ImageStyle)} options={IMAGE_STYLES.map((s) => ({ value: s, label: s }))} />
        </div>
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
        <p className="text-sm text-text2">No brand kit yet.</p>
        <Link href="/brand" className="inline-block mt-3"><Button size="sm">Create a brand kit</Button></Link>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader title="Active brand" subtitle="Used for generated copy, ads and exports." action={<Link href="/brand"><Button size="sm" variant="secondary" rightIcon={<ExternalLink className="size-3.5" />}>Edit brand kit</Button></Link>} />
        <div className="flex items-center gap-4">
          <img src={brand.logoUrl} alt="" className="size-14 rounded-lg object-cover border border-border" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{brand.name}</p>
            <p className="text-[13px] text-text2 truncate">{brand.industry || "No industry"} · {brand.audience || "No audience set"}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {brand.colors.map((c) => <span key={c} className="size-4 rounded-full border border-border-strong" style={{ background: c }} title={c} />)}
              <span className="text-[12px] text-muted ml-1">{brand.fonts.heading} / {brand.fonts.body}</span>
            </div>
          </div>
        </div>
        {brands.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Select
              label="Switch brand"
              name="brand"
              value={brand.id}
              onChange={(e) => { setCurrentBrand(e.target.value); toast.success("Brand switched", brands.find((b) => b.id === e.target.value)?.name); }}
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Brand voice" subtitle="Tone and writing style applied to generated copy." action={<Link href="/brand/voice"><Button size="sm" variant="secondary">Edit voice</Button></Link>} />
        <div className="flex flex-wrap gap-1.5 mb-2"><Badge tone="accent">{brand.voice.tone}</Badge>{brand.voice.keywords.slice(0, 4).map((k) => <Badge key={k} tone="outline">{k}</Badge>)}</div>
        <p className="text-[13px] text-text2 italic">{brand.voice.writingStyle || "No writing style defined yet."}</p>
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
  const renew = new Date(); renew.setMonth(renew.getMonth() + 1, 1);

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-text2">Current plan</p>
            <p className="text-2xl font-bold tracking-tight">{current.name} <span className="text-base font-medium text-text2">${current.priceMonthly}/mo</span></p>
            <p className="text-[12px] text-muted mt-1">Renews {formatDate(renew.toISOString())} · {formatNumber(current.credits)} credits per month</p>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing"><Button variant={next ? "primary" : "secondary"}>{next ? `Upgrade to ${next.name}` : "Manage plan"}</Button></Link>
            <Link href="/pricing"><Button variant="ghost">Compare plans</Button></Link>
          </div>
        </div>
        <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-5 pt-4 border-t border-border text-[13px] text-text2">
          {Object.values(current.features).map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success shrink-0" />{f}</li>)}
        </ul>
      </Card>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-text2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" /> Credits</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{formatNumber(credits)}</p>
            <p className="text-[12px] text-muted">{transactions.length} transactions in history</p>
          </div>
          <Link href="/credits"><Button variant="secondary">Buy credits</Button></Link>
        </div>
      </Card>
      <Card>
        <CardHeader title="Billing" subtitle="Payment method and invoices (simulated)." />
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
          <div className="h-8 w-12 rounded-xs bg-elevated flex items-center justify-center text-[10px] font-bold tracking-wider">VISA</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-[12px] text-muted">Expires 08/28 · Default</p>
          </div>
          <Badge tone="success" dot>Active</Badge>
        </div>
        <p className="text-[12px] text-muted mt-3">Payments are mocked in this prototype. No card is charged.</p>
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
    { id: "s1", device: "This device · Chrome on macOS", location: "New York, US", current: true, icon: Monitor },
    { id: "s2", device: "iPhone · Marketing Studio app", location: "New York, US", current: false, icon: Smartphone },
    { id: "s3", device: "Safari on macOS", location: "Los Angeles, US", current: false, icon: Monitor },
  ]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!current) { setError("Enter your current password."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setError("");
    setSaving(true);
    await delay(900);
    setSaving(false);
    setCurrent(""); setNext(""); setConfirm("");
    toast.success("Password updated", "Use your new password next time you sign in.");
  };

  return (
    <>
      <form onSubmit={changePassword}>
        <Card>
          <CardHeader title="Change password" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <Input label="New password" name="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="At least 8 characters." />
            <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs text-danger min-h-4">{error}</p>
            <Button type="submit" loading={saving} leftIcon={<KeyRound className="size-4" />}>Update password</Button>
          </div>
        </Card>
      </form>
      <Card>
        <CardHeader title="Two-factor authentication" />
        <Toggle
          label="Authenticator app"
          description={twoFactor ? "Enabled. You'll be asked for a code when signing in on a new device." : "Add a second step when signing in."}
          checked={twoFactor}
          onChange={(v) => { setTwoFactor(v); toast.success(v ? "Two-factor enabled" : "Two-factor disabled"); }}
        />
      </Card>
      <Card>
        <CardHeader
          title="Active sessions"
          action={sessions.length > 1 && <Button size="sm" variant="ghost" onClick={() => { setSessions((s) => s.filter((x) => x.current)); toast.success("Other sessions signed out"); }}>Sign out others</Button>}
        />
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <s.icon className="size-4 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.device}</p>
                <p className="text-[12px] text-muted">{s.location}</p>
              </div>
              {s.current ? <Badge tone="success" dot>Current</Badge> : (
                <Button size="sm" variant="ghost" onClick={() => { setSessions((list) => list.filter((x) => x.id !== s.id)); toast.success("Session signed out"); }}>Sign out</Button>
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
    { label: "Help center & FAQ", description: "Guides, shortcuts and answers to common questions.", href: "/help" },
    { label: "Contact support", description: "Send us a message. We reply within a day.", href: "/help" },
    { label: "Credits & pricing", description: "How credits work and what each plan includes.", href: "/pricing" },
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
        <CardHeader title="About" />
        <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
          <dt className="text-text2">Version</dt><dd>0.9.0 (prototype)</dd>
          <dt className="text-text2">Build</dt><dd>Next.js · frontend-only, mock APIs</dd>
          <dt className="text-text2">Data</dt><dd>Stored locally in this browser</dd>
        </dl>
      </Card>
    </>
  );
}
