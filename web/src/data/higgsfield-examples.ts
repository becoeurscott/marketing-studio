// Public preview links from https://higgsfield.ai/marketing-studio, checked 2026-10-25.
// These are source videos for Seedance's reference-to-video endpoint, not API preset IDs.
export interface HiggsfieldVideoPreset {
  id: string;
  name: string;
  url: string;
  poster: string;
  source: string;
  category: "UGC" | "Motion";
  /** Studio mode that can use this video reference best. */
  mode: "ugc" | "video";
  /** Art direction added to the user's brief before generation. */
  direction: string;
  /** Helpful starting copy when the user has not written a brief yet. */
  defaultPrompt: string;
}

export const higgsfieldExamples = [
  {
    "id": "green-tea-macro",
    "name": "Green Tea Macro",
    "url": "https://cdn.higgsfield.ai/marketing-studio-motion-preview/68a696dc-2c2e-43b1-b285-511c8783db1f.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/marketing-studio-motion-preview/eb685bb2-9aa9-42e1-bd9f-3296a5b7eae9.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/green-tea-macro-6089a97b-4e49-43ed-9338-09a9c63e2783",
    "category": "Motion",
    "mode": "video",
    "direction": "Use the selected reference video for its premium macro rhythm: extreme product close-ups, tactile details, soft natural highlights, slow controlled camera movement, and a polished product reveal.",
    "defaultPrompt": "Mettez en valeur les détails et la texture de mon produit avec un rendu premium."
  },
  {
    "id": "pixel-block-yard",
    "name": "Pixel Block Yard",
    "url": "https://cdn.higgsfield.ai/marketing-studio-motion-preview/353daae1-e520-486b-b7d5-83f026169305.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/marketing-studio-motion-preview/510e9364-771a-43f0-b8ca-9bd36deed0ab.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/pixel-block-yard-000b690e-7f6d-4a7c-9196-a90f15494bb6",
    "category": "Motion",
    "mode": "video",
    "direction": "Use the selected reference video for its playful graphic set, bold color blocking, energetic product reveal, and smooth stylized transitions while keeping the product accurate.",
    "defaultPrompt": "Créez une révélation produit joyeuse, colorée et dynamique."
  },
  {
    "id": "before-and-after",
    "name": "Before and After",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/a6bd1da8-b768-425e-beb6-821075efbc2e-6748bfc5a91afbfc.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_3Cfdr00kbZ1hJCLpPQkaicInqxv/hf_20260604_001524_97ecfb10-b20e-46a8-b2ce-2104dd612f08_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/before-and-after-3728af13-8efa-4703-a10f-69b142c2df52",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow the selected reference video's clear before-and-after UGC structure: relatable before moment, natural product demonstration, visible transformation, then an authentic reaction and concise call to action.",
    "defaultPrompt": "Montrez le problème avant, la démonstration du produit, puis le résultat avec une réaction naturelle."
  },
  {
    "id": "monospace-callouts",
    "name": "Monospace Callouts",
    "url": "https://cdn.higgsfield.ai/marketing-studio-motion-preview/aef59e19-f388-4dcc-b55a-e43a5c48c835.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/marketing-studio-motion-preview/6b262d6f-bd0d-4c88-8998-26c2535d88e4.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/monospace-callouts-46406130-acc3-43f0-b6fe-554a22cad279",
    "category": "Motion",
    "mode": "video",
    "direction": "Use the selected reference video for its editorial product rhythm, clean framing, purposeful camera moves, and concise graphic callout moments. Keep any generated text minimal and legible.",
    "defaultPrompt": "Présentez les bénéfices clés de mon produit avec un montage éditorial rythmé."
  }
] as const satisfies readonly HiggsfieldVideoPreset[];
