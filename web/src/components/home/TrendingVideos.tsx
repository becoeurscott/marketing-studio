"use client";

import { Play, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CommunityPost } from "@/lib/community";
import { cn } from "@/lib/utils";

export function TrendingVideos() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams({ kind: "video" });
    fetch(`/api/community?${q}`)
      .then((r) => r.json())
      .then((d: { posts?: CommunityPost[] }) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-highlight" />
        <h2 className="text-[17px] font-semibold tracking-tight">Tendances</h2>
        <span className="text-[12px] text-muted">Vidéos populaires de la communauté</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1 snap-x">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-[180px] aspect-[9/16] rounded-xl bg-white/[0.04] animate-pulse" />
            ))
          : posts.map((p) => (
              <VideoCard key={p.id} post={p} />
            ))}
      </div>
    </section>
  );
}

function VideoCard({ post }: { post: CommunityPost }) {
  const [playing, setPlaying] = useState(false);
  const toggle = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <div
      className="snap-start shrink-0 w-[180px] group relative overflow-hidden rounded-xl bg-white/[0.03]"
      onMouseEnter={() => setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
    >
      <div className="aspect-[9/16] relative">
        <video
          ref={toggle}
          src={post.url}
          poster={post.poster ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="size-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur">
              <Play className="size-4 text-white fill-white" />
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[11px] text-white line-clamp-2">{post.prompt}</p>
          <p className="text-[10px] text-white/50 mt-0.5">{post.author} · {post.modelLabel}</p>
        </div>
      </div>
    </div>
  );
}
