"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { CalendarItem, Campaign } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarItemModal } from "./CalendarItemModal";
import { PlatformIcon, adFormatLabel } from "./platform";

type View = "week" | "month";

const DAY_MS = 86400000;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = (d: Date) => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }; // Monday
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function CalendarView({ campaign, compact }: { campaign: Campaign; compact?: boolean }) {
  const assets = useStore((s) => s.assets);
  const updateCalendarItem = useStore((s) => s.updateCalendarItem);
  const toast = useToast();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [editing, setEditing] = useState<CalendarItem | null | "new">(null);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of campaign.calendar) {
      const k = dayKey(new Date(it.date));
      m.set(k, [...(m.get(k) ?? []), it]);
    }
    for (const list of m.values()) list.sort((a, b) => (a.date < b.date ? -1 : 1));
    return m;
  }, [campaign.calendar]);

  const days = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => new Date(s.getTime() + i * DAY_MS));
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const s = startOfWeek(first);
    const cells = Math.ceil((new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() + ((first.getDay() + 6) % 7)) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => new Date(s.getTime() + i * DAY_MS));
  }, [view, cursor]);

  const shift = (dir: 1 | -1) => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const title = view === "week"
    ? `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const onDrop = (e: DragEvent, day: Date) => {
    e.preventDefault();
    setDragOver(null);
    const itemId = e.dataTransfer.getData("text/calendar-item");
    const item = campaign.calendar.find((i) => i.id === itemId);
    if (!item) return;
    const old = new Date(item.date);
    const next = new Date(day);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    if (sameDay(old, next)) return;
    updateCalendarItem(campaign.id, item.id, { date: next.toISOString() });
    toast.success("Rescheduled", `${item.title} → ${next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`);
  };

  const today = startOfDay(new Date());

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft className="size-4" /></Button>
          <Button size="sm" variant="secondary" onClick={() => setCursor(today)}>Today</Button>
          <Button size="sm" variant="secondary" onClick={() => shift(1)} aria-label="Next"><ChevronRight className="size-4" /></Button>
          <h3 className="text-sm font-semibold ml-1 whitespace-nowrap">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Tabs variant="pill" layoutId={compact ? "cal-view-compact" : "cal-view"} items={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} value={view} onChange={setView} />
          <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => { setNewDate(today); setEditing("new"); }}>Add item</Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className={cn("grid grid-cols-7 text-[11px] uppercase tracking-wide text-muted mb-1", view === "week" && "hidden md:grid")}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
      </div>

      <div className={cn("grid gap-px bg-border rounded-lg overflow-hidden border border-border", view === "week" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-7")}>
        {days.map((day) => {
          const k = dayKey(day);
          const items = byDay.get(k) ?? [];
          const isToday = sameDay(day, today);
          const outside = view === "month" && day.getMonth() !== cursor.getMonth();
          return (
            <div
              key={k}
              onDragOver={(e) => { e.preventDefault(); if (dragOver !== k) setDragOver(k); }}
              onDragLeave={() => setDragOver((v) => (v === k ? null : v))}
              onDrop={(e) => onDrop(e, day)}
              className={cn(
                "bg-card p-1.5 md:p-2 flex flex-col gap-1 transition-colors",
                view === "week" ? "min-h-24 md:min-h-44" : compact ? "min-h-16 md:min-h-24" : "min-h-20 md:min-h-32",
                outside && "bg-surface/60",
                dragOver === k && "bg-accent/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-[12px] font-medium", isToday ? "h-6 min-w-6 px-1.5 rounded-full bg-accent text-white flex items-center justify-center whitespace-nowrap" : outside ? "text-muted" : "text-text2")}>
                  <span className="md:hidden">{view === "week" ? day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }) : day.getDate()}</span>
                  <span className="hidden md:inline">{day.getDate()}</span>
                </span>
                <button aria-label="Add item on this day" onClick={() => { setNewDate(day); setEditing("new"); }} className="size-5 rounded text-muted hover:text-text hover:bg-white/5 flex items-center justify-center"><Plus className="size-3" /></button>
              </div>
              {items.map((it) => (
                <CalendarChip key={it.id} item={it} thumb={assets.find((a) => a.id === it.assetId)?.thumbnail} dense={view === "month"} onClick={() => setEditing(it)} />
              ))}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted mt-2">Drag an item to another day to reschedule. No real publishing happens in the prototype.</p>

      <CalendarItemModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        campaign={campaign}
        item={editing === "new" ? null : editing}
        defaultDate={newDate ?? today}
      />
    </div>
  );
}

function CalendarChip({ item, thumb, dense, onClick }: { item: CalendarItem; thumb?: string; dense?: boolean; onClick: () => void }) {
  const tone = statusTone(item.status);
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/calendar-item", item.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={onClick}
      title={`${item.title} · ${adFormatLabel(item.format)} · ${item.status}`}
      className={cn(
        "w-full text-left rounded-md border border-border bg-elevated hover:border-white/20 transition-colors overflow-hidden cursor-grab active:cursor-grabbing",
        dense ? "p-1" : "p-1.5",
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {thumb ? <img src={thumb} alt="" className={cn("rounded object-cover shrink-0", dense ? "size-4" : "size-7")} /> : <span className={cn("rounded bg-white/6 shrink-0", dense ? "size-4" : "size-7")} />}
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", dense ? "text-[10px] hidden md:block" : "text-[12px]")}>{item.title}</p>
          <div className={cn("flex items-center gap-1 text-muted", dense ? "text-[9px]" : "text-[10px]")}>
            <PlatformIcon platform={item.platform} className="size-3" />
            <span className={cn(dense && "hidden lg:inline")}>{adFormatLabel(item.format)}</span>
          </div>
        </div>
        {!dense && <Badge tone={tone} dot className="capitalize hidden sm:inline-flex">{item.status}</Badge>}
        {dense && <span className={cn("size-1.5 rounded-full shrink-0", tone === "success" ? "bg-success" : tone === "accent" ? "bg-accent" : "bg-muted")} />}
      </div>
    </button>
  );
}
