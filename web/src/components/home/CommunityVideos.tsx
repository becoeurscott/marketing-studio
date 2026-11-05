"use client";

import Link from "next/link";
import { useState } from "react";
import { higgsfieldExamples } from "@/data/higgsfield-examples";

const videos = higgsfieldExamples.filter((video) => video.category === "UGC" || video.category === "TikTok").slice(0, 10);

function Preview({ video }: { video: (typeof videos)[number] }) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <article className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:w-48">
      <div className="relative aspect-[9/16] bg-black">
        {unavailable ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/60">Aperçu indisponible</div>
        ) : (
          <video src={video.url} poster={video.poster} autoPlay muted loop playsInline controls preload="metadata" onError={() => setUnavailable(true)} className="h-full w-full object-cover" aria-label={video.name} />
        )}
      </div>
      <div className="p-3"><p className="text-sm font-medium text-white">{video.name}</p><p className="mt-1 text-xs text-white/55">{video.category}</p></div>
    </article>
  );
}

export function CommunityVideos() {
  return (
    <section id="community-videos" className="mb-10 scroll-mt-24" aria-label="Vidéos de la communauté">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold tracking-tight">Vidéos de la communauté</h2><p className="mt-1 text-sm text-white/60">Découvrez les exemples UGC et TikTok Higgsfield.</p></div>
        <Link href="/community" className="text-sm font-medium text-highlight hover:underline">Voir toute la communauté →</Link>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
        {videos.map((video) => <Preview key={video.id} video={video} />)}
      </div>
    </section>
  );
}
