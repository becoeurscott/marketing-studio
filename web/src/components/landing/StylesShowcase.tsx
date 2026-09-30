import { SOKOZIA_STYLES } from "@/lib/styles";
import { Reveal, SectionTitle } from "./motion";

/** The 10 Sokozia styles, each shown with its reference image (same product, different scene). */
export function StylesShowcase() {
  return (
    <section id="styles" className="scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Styles Sokozia"
          title="Une photo, dix styles"
          text="Le même pot de karité, photographié au téléphone, puis placé dans dix styles pensés pour vendre en Afrique. Votre produit reste identique : seul le décor change."
        />
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SOKOZIA_STYLES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 5) * 0.06}>
              <figure className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/styles/${s.id}.jpg`} alt={`Style ${s.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <figcaption className="p-3">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="mt-0.5 text-xs text-text2 leading-snug">{s.description}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
