import type { CopyResult, CopyTool, Tone } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

export const COPY_TOOLS: { id: CopyTool; label: string; description: string }[] = [
  { id: "ad-copy", label: "Ad Copy", description: "Headline + primary text for paid social." },
  { id: "product-description", label: "Product Description", description: "Benefit-led PDP copy." },
  { id: "instagram-caption", label: "Instagram Caption", description: "Caption with hashtags." },
  { id: "tiktok-caption", label: "TikTok Caption", description: "Short, punchy caption." },
  { id: "email", label: "Email", description: "Subject line + body." },
  { id: "headline", label: "Headline", description: "Five headline options." },
  { id: "hook", label: "Hook", description: "Scroll-stopping openers." },
  { id: "cta", label: "CTA", description: "Call-to-action variations." },
  { id: "ugc-script", label: "UGC Script", description: "15–30s creator script." },
  { id: "landing-page", label: "Landing Page Copy", description: "Hero, benefits, proof, CTA." },
];

export const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "luxury", label: "Luxury" },
  { id: "bold", label: "Bold" },
  { id: "funny", label: "Funny" },
  { id: "minimal", label: "Minimal" },
  { id: "urgent", label: "Urgent" },
];

export const hooks: string[] = [
  "Nobody tells you this about vitamin C serums...",
  "You've been using this wrong your whole life.",
  "POV: you finally found the serum that actually works.",
  "I stopped my 10-step routine and did this instead.",
  "Dermatologists hate how simple this is.",
  "This is the only thing I changed. 30 days later...",
  "If your skin looks dull by 3pm, watch this.",
  "The $48 serum that replaced three products on my shelf.",
  "Wait for the glow at the end.",
  "Stop scrolling if you've never seen your skin like this.",
  "I was skeptical. Then I saw day seven.",
  "Here's what a 'clean' serum actually means.",
];

export const copySamples: CopyResult[] = [
  { id: "copy_1", tool: "instagram-caption", title: "Summer launch caption", tone: "friendly", platform: "instagram", text: "Meet Luma Glow Serum. Stabilized vitamin C, a lightweight finish, and a glow you'll notice by day seven. Launch week: 20% off, link in bio.\n\n#lumaskin #vitaminc #glowup #skincareroutine", createdAt: daysAgo(1) },
  { id: "copy_2", tool: "product-description", title: "PDP description", tone: "professional", text: "Luma Glow Serum is a vitamin C brightening serum designed for everyday skincare routines. A stabilized 12% formula targets dullness and uneven tone, while hyaluronic acid keeps skin comfortable. Clean, fragrance-free, and light enough to layer under SPF.", createdAt: daysAgo(2) },
  { id: "copy_3", tool: "email", title: "Launch announcement", tone: "urgent", text: "Subject: Your glow is here (20% off ends Sunday)\n\nAlex,\n\nLuma Glow Serum is live. Vitamin C done right: bright, even, everyday. Launch pricing ends Sunday at midnight.\n\nShop now →", createdAt: daysAgo(3) },
  { id: "copy_4", tool: "ugc-script", title: "Maya morning routine script", tone: "friendly", platform: "tiktok", text: "[Hook] Nobody tells you this about vitamin C serums...\n[Demo] Two drops. That's it. Pat it in before SPF.\n[Proof] Day seven and my skin looks awake before coffee.\n[CTA] Link's in my bio, launch discount ends Sunday.", createdAt: daysAgo(4) },
  { id: "copy_5", tool: "headline", title: "Headline options", tone: "bold", text: "1. Glow you can see in 7 days\n2. Vitamin C. Done right.\n3. Your morning just got brighter\n4. One serum. Zero fuss.\n5. The last serum you'll switch to", createdAt: daysAgo(5) },
];
