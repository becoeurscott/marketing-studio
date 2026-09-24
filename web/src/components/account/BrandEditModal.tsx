"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Brand } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BrandSection = "identity" | "colors" | "fonts" | "details";

const TITLES: Record<BrandSection, string> = { identity: "Brand identity", colors: "Color palette", fonts: "Typography", details: "Positioning" };
const FONTS = ["Inter", "Playfair Display", "DM Sans", "Space Grotesk", "Manrope", "Fraunces", "IBM Plex Sans", "Sora"];
const INDUSTRIES = ["Beauty", "Fashion", "Food & Beverage", "Technology", "Fitness", "Home", "Real Estate", "Finance", "Education", "Other"];

export interface BrandEditModalProps {
  brand: Brand | null;
  section: BrandSection | null;
  onClose: () => void;
}

export function BrandEditModal({ brand, section, onClose }: BrandEditModalProps) {
  const open = !!brand && !!section;
  return (
    <Modal open={open} onClose={onClose} title={section ? TITLES[section] : undefined} description={brand?.name}>
      {brand && section && <BrandForm key={`${brand.id}-${section}`} brand={brand} section={section} onClose={onClose} />}
    </Modal>
  );
}

function BrandForm({ brand, section, onClose }: { brand: Brand; section: BrandSection; onClose: () => void }) {
  const updateBrand = useStore((s) => s.updateBrand);
  const toast = useToast();
  const [name, setName] = useState(brand.name);
  const [website, setWebsite] = useState(brand.website);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [colors, setColors] = useState<string[]>(brand.colors);
  const [heading, setHeading] = useState(brand.fonts.heading);
  const [body, setBody] = useState(brand.fonts.body);
  const [description, setDescription] = useState(brand.description);
  const [industry, setIndustry] = useState(brand.industry || "Other");
  const [audience, setAudience] = useState(brand.audience);
  const [tags, setTags] = useState(brand.styleTags.join(", "));
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (section === "identity" && !name.trim()) { setError("Brand name is required."); return; }
    const patch: Partial<Brand> =
      section === "identity" ? { name: name.trim(), website: website.trim(), logoUrl: logoUrl.trim() || brand.logoUrl }
      : section === "colors" ? { colors: colors.filter(Boolean) }
      : section === "fonts" ? { fonts: { heading, body } }
      : { description: description.trim(), industry, audience: audience.trim(), styleTags: tags.split(",").map((t) => t.trim()).filter(Boolean) };
    updateBrand(brand.id, patch);
    toast.success("Brand updated", TITLES[section]);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {section === "identity" && (
        <>
          <Input label="Brand name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoFocus />
          <Input label="Website" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          <Input label="Logo URL" name="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} hint="Paste an image URL. Uploads are mocked in the prototype." />
        </>
      )}
      {section === "colors" && <ColorPalette value={colors} onChange={setColors} />}
      {section === "fonts" && (
        <>
          <Select label="Heading font" name="heading" value={heading} onChange={(e) => setHeading(e.target.value)} options={FONTS.map((f) => ({ value: f, label: f }))} />
          <Select label="Body font" name="body" value={body} onChange={(e) => setBody(e.target.value)} options={FONTS.map((f) => ({ value: f, label: f }))} />
          <div className="rounded-md bg-surface border border-border p-4">
            <p className="text-xl font-bold tracking-tight" style={{ fontFamily: heading }}>{brand.name} makes mornings brighter</p>
            <p className="text-sm text-text2 mt-1.5" style={{ fontFamily: body }}>Body copy preview. Short sentences, confident tone, never overly formal.</p>
          </div>
        </>
      )}
      {section === "details" && (
        <>
          <Textarea label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does the brand stand for?" />
          <Select label="Industry" name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
          <Input label="Target audience" name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Women and men 20–35…" />
          <Input label="Style tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} hint="Comma separated, e.g. Premium, Clean, Modern" />
        </>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/** Palette editor: swatch + native color picker + hex input per color, add/remove. */
export function ColorPalette({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = (i: number, v: string) => onChange(value.map((c, j) => (j === i ? v : c)));
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-medium text-text2">Palette</p>
      <div className="flex gap-2 mb-3">
        {value.map((c, i) => <span key={i} className="h-8 flex-1 rounded-md border border-white/10" style={{ background: isHex(c) ? c : "#333" }} />)}
      </div>
      {value.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <label className="relative size-10 rounded-md border border-border-strong overflow-hidden shrink-0 cursor-pointer" style={{ background: isHex(c) ? c : "#333" }}>
            <input type="color" aria-label={`Color ${i + 1}`} value={isHex(c) ? c : "#333333"} onChange={(e) => set(i, e.target.value.toUpperCase())} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <input
            value={c}
            onChange={(e) => set(i, e.target.value)}
            aria-label={`Hex for color ${i + 1}`}
            className={cn("flex-1 h-10 bg-surface border rounded-md px-3 text-sm font-mono uppercase focus:border-accent focus:outline-none", isHex(c) ? "border-border-strong" : "border-danger")}
            maxLength={7}
          />
          <button type="button" aria-label="Remove color" disabled={value.length <= 1} onClick={() => onChange(value.filter((_, j) => j !== i))} className="size-10 rounded-md text-muted hover:text-danger hover:bg-white/5 disabled:opacity-30 flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" leftIcon={<Plus className="size-4" />} disabled={value.length >= 8} onClick={() => onChange([...value, "#A855F7"])}>Add color</Button>
    </div>
  );
}
