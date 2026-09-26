"use client";

import { Building2, FolderKanban, Images, LogOut, Mail, Megaphone, Pencil, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/account/ConfirmModal";
import { PageHeader, Section } from "@/components/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { avatar, formatDate, formatNumber, timeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const projects = useStore((s) => s.projects);
  const assets = useStore((s) => s.assets);
  const campaigns = useStore((s) => s.campaigns);
  const generations = useStore((s) => s.generations);
  const credits = useStore((s) => s.credits);
  const plan = useStore((s) => s.plan);
  const workspaceName = useStore((s) => s.workspaceName);
  const reset = useStore((s) => s.reset);
  const router = useRouter();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const stats = [
    { label: "Projets", value: projects.length, icon: FolderKanban, href: "/projects" },
    { label: "Ressources", value: assets.length, icon: Images, href: "/assets" },
    { label: "Campagnes", value: campaigns.length, icon: Megaphone, href: "/campaigns" },
    { label: "Générations", value: generations.length, icon: Wand2, href: "/generations" },
  ];

  const signOut = () => {
    reset();
    toast.info("Déconnexion effectuée", "Les données de démo ont été réinitialisées.");
    router.replace("/onboarding");
  };

  return (
    <>
      <PageHeader title="Profil" actions={<Button variant="secondary" leftIcon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Modifier le profil</Button>} />

      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-accent/25 via-accent2/15 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 pt-8">
          <Avatar src={user.avatarUrl} name={user.name} size={88} className="ring-4 ring-card" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold tracking-tight truncate">{user.name}</h2>
            <p className="text-sm text-text2 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{user.email}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" />{user.company}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge tone="accent">{user.role}</Badge>
              <Badge tone="outline">Forfait <span className="capitalize">{plan}</span></Badge>
              <Badge tone="neutral">{workspaceName}</Badge>
            </div>
          </div>
          <p className="text-[12px] text-muted sm:text-right">Membre depuis le {formatDate(user.createdAt)}</p>
        </div>
      </Card>

      <Section title="Vue d’ensemble">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="rounded-lg border border-border bg-card p-4 hover:border-white/15 transition-colors">
              <s.icon className="size-4 text-text2" />
              <p className="text-2xl font-bold tracking-tight mt-2 tabular-nums">{formatNumber(s.value)}</p>
              <p className="text-[13px] text-text2">{s.label}</p>
            </Link>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] text-text2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-highlight" /> Crédits</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums mt-1">{formatNumber(credits)}</p>
            </div>
            <Link href="/credits" className="shrink-0"><Button size="sm" variant="secondary">Gérer</Button></Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-text2">Dernière activité</p>
              <p className="text-sm font-medium mt-1 truncate">{generations[0] ? generations[0].prompt : "Aucune génération pour le moment"}</p>
              {generations[0] && <p className="text-[12px] text-muted">{timeAgo(generations[0].createdAt)}</p>}
            </div>
            <Link href="/generations" className="shrink-0"><Button size="sm" variant="secondary">Historique</Button></Link>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Se déconnecter</p>
            <p className="text-[13px] text-text2">Met fin à la session et réinitialise les données de démo sur cet appareil.</p>
          </div>
          <Button variant="danger" leftIcon={<LogOut className="size-4" />} onClick={() => setSigningOut(true)}>Se déconnecter</Button>
        </div>
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le profil">
        <ProfileForm key={String(editing)} user={user} onClose={() => setEditing(false)} onSave={(patch) => { updateUser(patch); toast.success("Profil mis à jour"); }} />
      </Modal>

      <ConfirmModal open={signingOut} onClose={() => setSigningOut(false)} danger title="Se déconnecter ?" description="Vous serez redirigé vers l’onboarding et les données de démo seront réinitialisées." confirmLabel="Se déconnecter" onConfirm={signOut}>
        <p className="text-sm text-text2">Les projets, ressources et paramètres de cet appareil reviendront aux données d’exemple.</p>
      </ConfirmModal>
    </>
  );
}

function ProfileForm({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (p: Partial<User>) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company);
  const [role, setRole] = useState(user.role);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est obligatoire."); return; }
    onSave({ name: name.trim(), email: email.trim(), company: company.trim(), role: role.trim(), avatarUrl });
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={name || "?"} size={64} />
        <div className="flex flex-wrap gap-2">
          {[12, 47, 33, 20, 5, 58].map((n) => (
            <button key={n} type="button" onClick={() => setAvatarUrl(avatar(n))} aria-label={`Choisir l’avatar ${n}`} className="rounded-full ring-2 ring-transparent aria-pressed:ring-accent" aria-pressed={avatarUrl === avatar(n)}>
              <Avatar src={avatar(n)} name="" size={32} />
            </button>
          ))}
        </div>
      </div>
      <Input label="Nom" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus />
      <Input label="E-mail" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Entreprise" name="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input label="Poste" name="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Fondateur" />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}
