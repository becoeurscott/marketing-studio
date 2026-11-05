"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutTemplate, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

type Template = { id: string; title: string; thumbnail?: string };
type Fields = Record<string, { type: string }>;
async function read(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Canva est indisponible.");
  return data;
}
async function action(name: string, body: object) {
  return read(await fetch(`/api/canva?action=${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}
async function poll(kind: string, ticket: string, signal: AbortSignal) {
  for (let i = 0; i < 60; i++) {
    if (signal.aborted) throw new Error("Opération interrompue.");
    const result = await action("poll", { kind, ticket });
    if (result.status === "success") return result;
    await new Promise<void>((resolve) => { const timer = setTimeout(resolve, 2000); signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true }); });
  }
  throw new Error("Canva prend plus de temps que prévu. Réessayez dans quelques instants.");
}

export function CanvaTemplates() {
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [items, setItems] = useState<Template[]>([]);
  const [continuation, setContinuation] = useState<string>();
  const [selected, setSelected] = useState<Template | null>(null);
  const [fields, setFields] = useState<Fields>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [imageNames, setImageNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<string>();
  const [pendingExport, setPendingExport] = useState<string>();
  const assets = useStore(s => s.assets);
  const addAsset = useStore(s => s.addAsset);
  const controller = useRef<AbortController | null>(null);
  const fieldRequest = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  const images = assets.filter(a => a.type === "image");
  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text";

  async function catalog(more?: string) {
    const data = await read(await fetch(`/api/canva?catalog=1${more ? `&continuation=${encodeURIComponent(more)}` : ""}`));
    setItems(previous => more ? [...previous, ...data.items].filter((t, i, all) => all.findIndex(x => x.id === t.id) === i) : data.items);
    setContinuation(data.continuation);
  }
  async function refresh() {
    setError(""); setBusy("Chargement des modèles…");
    try {
      const state = await read(await fetch("/api/canva"));
      setStatus(state);
      if (state.connected) await catalog();
      else { setItems([]); setSelected(null); }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  useEffect(() => {
    void refresh().then(() => {
      if (new URLSearchParams(window.location.search).get("canva") === "error") setError("La connexion Canva a échoué ou a été annulée. Réessayez.");
    });
    // Initial connection status is loaded once; subsequent refreshes are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function choose(template: Template) {
    const requestId = ++fieldRequest.current;
    setSelected(template); setFields({}); setValues({}); setImageNames({}); setResult(undefined); setPendingExport(undefined); setError(""); setBusy("Lecture du modèle…");
    try {
      const data = await read(await fetch(`/api/canva?template=${encodeURIComponent(template.id)}`));
      if (requestId === fieldRequest.current) setFields(data.fields);
    } catch (e) { if (requestId === fieldRequest.current) setError((e as Error).message); }
    finally { if (requestId === fieldRequest.current) setBusy(""); }
  }
  async function upload(name: string, blob: Blob, label: string) {
    setBusy("Envoi de l’image à Canva…"); setError("");
    const control = new AbortController(); controller.current = control;
    try {
      const start = await read(await fetch("/api/canva?action=upload", { method: "POST", headers: { "Content-Type": blob.type }, body: blob, signal: control.signal }));
      const done = await poll("upload", start.ticket, control.signal);
      setValues(v => ({ ...v, [name]: done.asset })); setImageNames(v => ({ ...v, [name]: label }));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  async function save(exportTicket: string) {
    setBusy("Enregistrement dans vos médias…");
    const saved = await action("save", { export: exportTicket });
    addAsset({ name: selected!.title, type: "image", url: saved.url, thumbnail: saved.url, storageKey: saved.key, sizeKb: saved.sizeKb, projectId: null, favorite: false, tags: ["Canva", selected!.id] });
    setResult(saved.url); setPendingExport(undefined);
  }
  async function generate() {
    if (!selected) return;
    const control = new AbortController(); controller.current = control;
    setError(""); setResult(undefined);
    try {
      if (pendingExport) { await save(pendingExport); return; }
      setBusy("Personnalisation du modèle…");
      const start = await action("generate", { templateId: selected.id, title: selected.title, fields: values });
      const filled = await poll("autofill", start.ticket, control.signal);
      setBusy("Export de votre image…");
      const exported = await action("export", { design: filled.design });
      await poll("export", exported.ticket, control.signal);
      setPendingExport(exported.ticket);
      await save(exported.ticket);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  const supported = Object.keys(fields).length > 0 && Object.values(fields).every(f => ["text", "image"].includes(f.type));
  const complete = supported && Object.keys(fields).every(key => values[key]?.trim());
  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-4 md:p-6" aria-label="Modèles Canva">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-lg font-semibold"><LayoutTemplate className="size-5" /> Créer avec un modèle Canva</h2><p className="mt-1 text-sm text-text2">Choisissez une mise en page, ajoutez vos images et vos textes, puis créez votre visuel.</p></div>
        {status?.connected ? <div className="flex gap-2"><Button variant="ghost" size="sm" disabled={!!busy} onClick={() => void refresh()} aria-label="Actualiser les modèles"><RefreshCw className="size-4" /></Button><Button variant="secondary" size="sm" disabled={!!busy} onClick={async () => { try { await action("disconnect", {}); await refresh(); } catch (e) { setError((e as Error).message); } }}>Déconnecter Canva</Button></div> : <Button disabled={!status?.configured || !!busy} onClick={async () => { setError(""); setBusy("Connexion…"); try { const data = await read(await fetch("/api/canva/connect", { method: "POST" })); window.location.assign(data.url); } catch (e) { setError((e as Error).message); setBusy(""); } }}>Connecter Canva</Button>}
      </div>
      {status && !status.configured && <p className="mt-4 text-sm text-text2">Les modèles Canva seront disponibles dès que l’administrateur aura activé la connexion.</p>}
      {status?.configured && !status.connected && <p className="mt-4 text-sm text-text2">Connectez un compte ayant accès aux modèles et à Autofill (Canva Pro, Teams ou Enterprise).</p>}
      {error && <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {busy && <p role="status" className="mt-4 text-sm text-text2">{busy}</p>}
      {status?.connected && <>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map(t => <button key={t.id} disabled={!!busy} onClick={() => void choose(t)} aria-pressed={selected?.id === t.id} className={`overflow-hidden rounded-lg border text-left disabled:opacity-50 ${selected?.id === t.id ? "border-accent" : "border-border"}`}>
            {/* Canva thumbnails are short-lived provider URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {t.thumbnail ? <img src={t.thumbnail} alt="" className="h-36 w-full object-contain bg-black/20" /> : <div className="flex h-36 items-center justify-center"><LayoutTemplate /></div>}
            <span className="block p-3 text-sm font-medium">{t.title}</span>
          </button>)}
        </div>
        {!items.length && !busy && <p className="mt-4 text-sm text-text2">Aucun modèle accessible sur cette page. Publiez un modèle Canva avec des champs texte et image, puis actualisez.{continuation ? " Vous pouvez aussi charger la page suivante." : ""}</p>}
        {continuation && <Button className="mt-3" variant="secondary" disabled={!!busy} onClick={async () => { setBusy("Chargement…"); try { await catalog(continuation); } catch (e) { setError((e as Error).message); } finally { setBusy(""); } }}>Charger plus de modèles</Button>}
      </>}
      {selected && <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{selected.title}</h3><Button variant="ghost" size="sm" disabled={!!busy} aria-label="Fermer le modèle" onClick={() => setSelected(null)}><X className="size-4" /></Button></div>
        {!supported && !busy && <p className="mt-3 text-sm text-text2">Choisissez un modèle contenant uniquement des champs personnalisables texte et image.</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(fields).map(([name, field]) => <div key={name}>
            <label htmlFor={`canva-${name}`} className="mb-2 block text-sm font-medium">{name.replaceAll("_", " ")}</label>
            {field.type === "text" ? <input id={`canva-${name}`} className={inputClass} maxLength={4000} value={values[name] ?? ""} disabled={!!busy || !!pendingExport} onChange={e => setValues(v => ({ ...v, [name]: e.target.value }))} /> : field.type === "image" ? <div className="space-y-2">
              <input id={`canva-${name}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy || !!pendingExport} className={inputClass} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(name, file, file.name); e.target.value = ""; }} />
              <select aria-label={`Choisir une image pour ${name}`} className={inputClass} value="" disabled={!!busy || !!pendingExport} onChange={async e => { const asset = images.find(a => a.id === e.target.value); if (!asset) return; setBusy("Préparation de l’image…"); try { const res = await fetch(asset.url); if (!res.ok) throw new Error("Image inaccessible. Téléchargez-la puis importez-la."); await upload(name, await res.blob(), asset.name); } catch (e) { setError((e as Error).message); setBusy(""); } }}><option value="">Choisir dans mes images générées</option>{images.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              {imageNames[name] && <p className="flex items-center gap-1 text-xs text-text2"><Upload className="size-3" /> {imageNames[name]}</p>}
            </div> : <p className="text-sm text-text2">Champ non pris en charge : {field.type}</p>}
          </div>)}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4"><Button leftIcon={<Sparkles className="size-4" />} disabled={!complete || !!busy || !!result} loading={!!busy} onClick={() => void generate()}>{pendingExport ? "Réessayer l’enregistrement" : "Générer mon visuel"}</Button><Link href="/studio/image" className="text-sm text-text2 underline">Créer d’abord une image avec l’IA</Link></div>
        {result && <div className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt={`Visuel généré : ${selected.title}`} className="max-h-96 max-w-full rounded-lg object-contain" />
          <p role="status" className="mt-3 text-sm text-text2">Votre visuel est enregistré. <Link href="/assets" className="underline text-text">Voir mes médias</Link></p>
        </div>}
      </div>}
    </section>
  );
}
