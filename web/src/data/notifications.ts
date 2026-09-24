import type { Notification, NotificationKind } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

type R = [NotificationKind, string, string, string | undefined, number, boolean];
const rows: R[] = [
  ["generation-complete", "Your images are ready", "4 product shots for Luma Glow Serum finished generating.", "/generations", 0, false],
  ["campaign-ready", "Luma Glow Summer Launch is ready", "All 5 formats have been generated. Review the campaign workspace.", "/campaigns/camp_luma_summer", 0, false],
  ["credits-low", "Credits running low", "You have 1,250 credits left. Video generations cost 50 each.", "/credits", 1, false],
  ["export-complete", "Export complete", "Summer launch — IG carousel.zip is ready to download.", "/assets", 1, true],
  ["new-template", "New template: Skincare Routine GRWM", "A new UGC template was added to Beauty.", "/templates/tpl_22", 2, true],
  ["project-shared", "Sarah shared a project with you", "Cold Brew TikTok Series is now shared with your workspace.", "/projects/proj_coldbrew_tiktok", 2, true],
  ["generation-complete", "Video render finished", "Slow orbit around the serum bottle (10s) is ready.", "/generations", 3, true],
  ["campaign-ready", "UGC Hook Test — Serum updated", "4 new variations were added.", "/campaigns/camp_ugc_test", 3, true],
  ["export-complete", "Export complete", "UGC ads — TikTok.mp4 exported at Maximum quality.", "/assets", 4, true],
  ["generation-complete", "Copy generated", "10 hooks for TikTok UGC are ready to review.", "/generations", 4, true],
  ["new-template", "New template: Cinematic Product Film", "Try it in Studio with your product photo.", "/templates/tpl_21", 5, true],
  ["project-shared", "Michael commented on Luxury Watch Campaign", "\"Love the dial macro — can we get a 16:9 version?\"", "/projects/proj_watch", 6, true],
  ["generation-complete", "Product shoot finished", "6 environment shots for SPF 50 Daily Shield.", "/generations", 6, true],
  ["credits-low", "Credits topped up", "1,000 credits were added to your account.", "/credits", 7, true],
  ["campaign-ready", "Fitness Apparel Drop completed", "Campaign finished with 2.4% CTR.", "/campaigns/camp_fitness_drop", 8, true],
  ["export-complete", "Export complete", "Campaign deck.pdf is ready.", "/assets", 9, true],
  ["generation-complete", "Ad variations ready", "Creative A–D for Instagram carousel.", "/generations", 10, true],
  ["new-template", "New template: Before & After Carousel", "Proof-driven layouts for Beauty.", "/templates/tpl_11", 11, true],
  ["project-shared", "Sarah joined your workspace", "Sarah Kim accepted the Admin invite.", "/workspace", 12, true],
  ["generation-complete", "Video render finished", "Cold brew pour push-in (5s) is ready.", "/generations", 13, true],
  ["campaign-ready", "Watch Editorial Series completed", "Final analytics are available.", "/campaigns/camp_watch_editorial", 14, true],
  ["export-complete", "Export complete", "Watch reel — 4K.mp4 finished.", "/assets", 15, true],
];

export const notifications: Notification[] = rows.map(([kind, title, body, href, d, read], i) => ({
  id: `notif_${i + 1}`,
  kind, title, body, href, read,
  createdAt: daysAgo(d, 18 - (i % 9)),
}));
