"use client";

import { Bell, CheckCheck, Download, LayoutTemplate, Megaphone, Sparkles, Users, Wand2, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/ui/FilterBar";
import { useStore } from "@/lib/store";
import type { Notification, NotificationKind } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const KIND_META: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  "generation-complete": { icon: Wand2, tone: "bg-accent/15 text-highlight" },
  "campaign-ready": { icon: Megaphone, tone: "bg-success/15 text-success" },
  "export-complete": { icon: Download, tone: "bg-white/8 text-text" },
  "credits-low": { icon: Sparkles, tone: "bg-warning/15 text-warning" },
  "new-template": { icon: LayoutTemplate, tone: "bg-accent/15 text-highlight" },
  "project-shared": { icon: Users, tone: "bg-white/8 text-text" },
};

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const unread = notifications.filter((n) => !n.read).length;

  const groups = useMemo(() => {
    const list = [...notifications].filter((n) => filter === "all" || !n.read).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const today: Notification[] = [], yesterday: Notification[] = [], earlier: Notification[] = [];
    for (const n of list) {
      const t = new Date(n.createdAt).getTime();
      if (t >= startOfToday.getTime()) today.push(n);
      else if (t >= startOfYesterday.getTime()) yesterday.push(n);
      else earlier.push(n);
    }
    return [["Aujourd’hui", today], ["Hier", yesterday], ["Plus tôt", earlier]] as [string, Notification[]][];
  }, [notifications, filter]);

  const total = groups.reduce((s, [, l]) => s + l.length, 0);

  const open = (n: Notification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour."}
        actions={<Button variant="secondary" size="sm" leftIcon={<CheckCheck className="size-4" />} disabled={!unread} onClick={markAll}>Tout marquer comme lu</Button>}
      />

      <FilterBar className="mb-5" options={[{ value: "all", label: "Toutes", count: notifications.length }, { value: "unread", label: "Non lues", count: unread }]} value={filter} onChange={setFilter} />

      {total === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "Aucune notification non lue" : "Aucune notification pour le moment"}
          description={filter === "unread" ? "Parfait, tout a été lu." : "Les mises à jour de vos générations, campagnes et exports apparaîtront ici."}
          cta={filter === "unread" ? { label: "Tout afficher", onClick: () => setFilter("all") } : { label: "Ouvrir le Studio", href: "/studio" }}
        />
      ) : (
        <div className="space-y-6 max-w-3xl">
          {groups.filter(([, l]) => l.length).map(([label, list]) => (
            <section key={label}>
              <h2 className="text-[12px] uppercase tracking-wide text-muted font-medium mb-2 px-1">{label}</h2>
              <Card padded={false} className="divide-y divide-border overflow-hidden">
                {list.map((n) => {
                  const meta = KIND_META[n.kind];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => open(n)}
                      className={cn("w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]", !n.read && "bg-accent/[0.04]")}
                    >
                      <span className={cn("size-9 rounded-md flex items-center justify-center shrink-0 mt-0.5", meta.tone)}>
                        <Icon className="size-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn("text-sm leading-snug", n.read ? "text-text2" : "text-text font-medium")}>{n.title}</p>
                          <span className="text-[11px] text-muted whitespace-nowrap shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-[13px] text-text2 mt-0.5 line-clamp-2">{n.body}</p>
                      </div>
                      <span className={cn("size-2 rounded-full mt-2 shrink-0", n.read ? "bg-transparent" : "bg-accent")} aria-label={n.read ? undefined : "Non lue"} />
                    </button>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
