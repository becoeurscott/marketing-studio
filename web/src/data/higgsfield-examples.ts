// Public preview links from https://higgsfield.ai/marketing-studio, checked 2026-10-25.
// These are source videos for Seedance's reference-to-video endpoint, not API preset IDs.
export interface HiggsfieldVideoPreset {
  id: string;
  name: string;
  url: string;
  poster: string;
  source: string;
  category: "UGC" | "Motion" | "TikTok";
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
  ,
  {
    "id": "giant-figure-6017577c-d9f9-4d1a-87d6-26e96e8e4f25",
    "name": "Giant Figure",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/6017577c-d9f9-4d1a-87d6-26e96e8e4f25-19ef25a6c2ac8cc9.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/6017577c-d9f9-4d1a-87d6-26e96e8e4f25-bc8e90896136facf.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/giant-figure-6017577c-d9f9-4d1a-87d6-26e96e8e4f25",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Giant Figure product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "giant-figure-c9f0c947-946a-4e15-b124-b7031b432434",
    "name": "Giant Figure",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/c9f0c947-946a-4e15-b124-b7031b432434-983df3ca6a193776.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_3Cfdr00kbZ1hJCLpPQkaicInqxv/hf_20260603_150008_ee9cf142-7741-40e9-8076-897fb0947742_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/giant-figure-c9f0c947-946a-4e15-b124-b7031b432434",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Giant Figure product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "unboxing-virtual-try-on-809b9092-e515-49a0-802f-294a60375676",
    "name": "Unboxing Virtual Try-On",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/809b9092-e515-49a0-802f-294a60375676-fbf4cac8830fbe0a.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_3Cfdr00kbZ1hJCLpPQkaicInqxv/hf_20260603_225935_abf54d8e-3766-4bf5-9163-2f87467c9953_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/unboxing-virtual-try-on-809b9092-e515-49a0-802f-294a60375676",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Unboxing Virtual Try-On product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "giant-figure-6eaef5bc-d7e0-495d-a64f-f4bd8bf8f6cd",
    "name": "Giant Figure",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/6eaef5bc-d7e0-495d-a64f-f4bd8bf8f6cd-efa7a02a7c17ec9f.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/6eaef5bc-d7e0-495d-a64f-f4bd8bf8f6cd-87ab30f3c945e3be.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/giant-figure-6eaef5bc-d7e0-495d-a64f-f4bd8bf8f6cd",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Giant Figure product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "classic-unboxing-bcd3706f-b2ee-43c5-a89b-ec9acd294e8b",
    "name": "Classic Unboxing",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/9f8bc173-e29a-4fa9-8809-4f6ba0475974-74d89c050f6fa165.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_39acLUpaKDzX3Ox7Ekzzl7vlQ67/hf_20260413_133035_bf1fbde5-d95a-4c23-907d-df9c475f948f_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/classic-unboxing-bcd3706f-b2ee-43c5-a89b-ec9acd294e8b",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Classic Unboxing product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "unboxing-virtual-try-on-eb68f0d4-6a2e-473b-ad39-a34c7e8b1d00",
    "name": "Unboxing Virtual Try-On",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/eb68f0d4-6a2e-473b-ad39-a34c7e8b1d00-7fd7325a427ac5a7.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/eb68f0d4-6a2e-473b-ad39-a34c7e8b1d00-0c10a0d8366188b4.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/unboxing-virtual-try-on-eb68f0d4-6a2e-473b-ad39-a34c7e8b1d00",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Unboxing Virtual Try-On product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "ugc-virtual-try-on-25343f9c-1e80-4921-b998-24fa6e3008ce",
    "name": "UGC Virtual Try On",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/4dcc2a50-47de-46a1-b7e6-d5bd378bb5d1-91841e48382ec5af.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_39acLUpaKDzX3Ox7Ekzzl7vlQ67/hf_20260413_132040_3db6758b-7eef-4046-87e1-ec81097c126e_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/ugc-virtual-try-on-25343f9c-1e80-4921-b998-24fa6e3008ce",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a UGC Virtual Try On product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "ugc-addiction-63ee88b6-f03f-4f7d-b172-85556c9959f1",
    "name": "UGC Addiction",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/5d920c0b-523d-443f-b122-a09de57d66f7-7421d168255a357a.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_3Cfdr00kbZ1hJCLpPQkaicInqxv/hf_20260603_153723_6b1bb39e-dd94-43fc-9fe8-007a658e49a5_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/ugc-addiction-63ee88b6-f03f-4f7d-b172-85556c9959f1",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a UGC Addiction product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "unboxing-virtual-try-on-367643d9-3fc5-43ae-aef5-0eeffd18d794",
    "name": "Unboxing Virtual Try-On",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/367643d9-3fc5-43ae-aef5-0eeffd18d794-382ee9b9d34ccc3d.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/367643d9-3fc5-43ae-aef5-0eeffd18d794-851b8c239f2ed097.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/unboxing-virtual-try-on-367643d9-3fc5-43ae-aef5-0eeffd18d794",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Unboxing Virtual Try-On product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "unboxing-asmr-109d5cef-9e70-46ac-ad42-f235ccce7840",
    "name": "Unboxing ASMR",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/109d5cef-9e70-46ac-ad42-f235ccce7840-79df93c1a7b7ec28.mp4",
    "poster": "https://cdn.higgsfield.ai/cdn-cgi/image/width=1080,quality=80,format=auto/user_3E2rnQvU0fCTk5iGN1MMbzgiYer/hf_20260604_151251_092a48c7-4867-41ca-8d63-dfb1526785fb_thumbnail.webp",
    "source": "https://higgsfield.ai/marketing-studio/preset/unboxing-asmr-109d5cef-9e70-46ac-ad42-f235ccce7840",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Unboxing ASMR product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "mystery-box-d0fba758-1830-49db-b879-f91c913a0055",
    "name": "Mystery Box",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/ecf14de6-a542-4c31-88dc-096abb95e108-3a58c709f0d2555e.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/ecf14de6-a542-4c31-88dc-096abb95e108-2aba61554bf94b2e.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/mystery-box-d0fba758-1830-49db-b879-f91c913a0055",
    "category": "UGC",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield UGC template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Mystery Box product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "this-gadget-saved-me-0ffef77f-c1ad-4d98-9847-29afe067b2c3",
    "name": "This Gadget Saved Me",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/0ffef77f-c1ad-4d98-9847-29afe067b2c3-a739d64f60a6fb5b.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/0ffef77f-c1ad-4d98-9847-29afe067b2c3-94eab0f0131f5125.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/this-gadget-saved-me-0ffef77f-c1ad-4d98-9847-29afe067b2c3",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a This Gadget Saved Me product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "this-gadget-saved-me-2c90d936-07e9-4f0e-a0eb-fb7cdbf48228",
    "name": "This Gadget Saved Me",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/2c90d936-07e9-4f0e-a0eb-fb7cdbf48228-8b28bde63ae889a5.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/2c90d936-07e9-4f0e-a0eb-fb7cdbf48228-e8f082e101b9b1b3.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/this-gadget-saved-me-2c90d936-07e9-4f0e-a0eb-fb7cdbf48228",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a This Gadget Saved Me product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "this-gadget-saved-me-a9af9e6c-f2ca-4bc6-8681-bb8e132a0af3",
    "name": "This Gadget Saved Me",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/a9af9e6c-f2ca-4bc6-8681-bb8e132a0af3-90973eabda978417.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/a9af9e6c-f2ca-4bc6-8681-bb8e132a0af3-685ceb1fb93b1eee.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/this-gadget-saved-me-a9af9e6c-f2ca-4bc6-8681-bb8e132a0af3",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a This Gadget Saved Me product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "couple-sharing-at-home-fd5c91da-3622-4451-8c91-cc75337f9924",
    "name": "Couple Sharing At Home",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/fd5c91da-3622-4451-8c91-cc75337f9924-a340423e6246f392.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/fd5c91da-3622-4451-8c91-cc75337f9924-e08fa9d96c244ec7.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/couple-sharing-at-home-fd5c91da-3622-4451-8c91-cc75337f9924",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Couple Sharing At Home product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "couple-sharing-at-home-8ed3bce7-94b5-4a00-bea5-7139e34cf014",
    "name": "Couple Sharing At Home",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/8ed3bce7-94b5-4a00-bea5-7139e34cf014-bb64d10c97a4e13b.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/8ed3bce7-94b5-4a00-bea5-7139e34cf014-2ec0b9c1d3add96e.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/couple-sharing-at-home-8ed3bce7-94b5-4a00-bea5-7139e34cf014",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Couple Sharing At Home product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "couple-sharing-at-home-5afcdf1f-587a-4062-8476-e791b5117f9b",
    "name": "Couple Sharing At Home",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/5afcdf1f-587a-4062-8476-e791b5117f9b-a94d63838639490d.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/5afcdf1f-587a-4062-8476-e791b5117f9b-f175a7e7b862ce02.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/couple-sharing-at-home-5afcdf1f-587a-4062-8476-e791b5117f9b",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Couple Sharing At Home product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "selfie-testimonial-5d6a8621-cc39-4347-b8b7-91e1509b21ee",
    "name": "Selfie Testimonial",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/5d6a8621-cc39-4347-b8b7-91e1509b21ee-cefa4045a4d68c9b.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/5d6a8621-cc39-4347-b8b7-91e1509b21ee-e4f321f718c6a1ab.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/selfie-testimonial-5d6a8621-cc39-4347-b8b7-91e1509b21ee",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Selfie Testimonial product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "selfie-testimonial-62848384-ca64-46c0-87c0-c0b1fcc5df11",
    "name": "Selfie Testimonial",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/62848384-ca64-46c0-87c0-c0b1fcc5df11-379f1af60b6068c1.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/62848384-ca64-46c0-87c0-c0b1fcc5df11-39a9685211767250.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/selfie-testimonial-62848384-ca64-46c0-87c0-c0b1fcc5df11",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Selfie Testimonial product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "selfie-testimonial-7375cf22-0e39-46f8-b40c-73cbe3e88f44",
    "name": "Selfie Testimonial",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/7375cf22-0e39-46f8-b40c-73cbe3e88f44-44afa79979b2b168.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/7375cf22-0e39-46f8-b40c-73cbe3e88f44-8b2b4b494524d5f4.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/selfie-testimonial-7375cf22-0e39-46f8-b40c-73cbe3e88f44",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Selfie Testimonial product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "selfie-testimonial-125e89bd-685f-4f22-aa5a-af3f354e82dd",
    "name": "Selfie Testimonial",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/125e89bd-685f-4f22-aa5a-af3f354e82dd-d950b4d0714e6875.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/125e89bd-685f-4f22-aa5a-af3f354e82dd-705786a84475d218.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/selfie-testimonial-125e89bd-685f-4f22-aa5a-af3f354e82dd",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Selfie Testimonial product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "direct-to-camera-0708a3d1-c6b8-4097-9221-9798b21a47b2",
    "name": "Direct-to-Camera",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/0708a3d1-c6b8-4097-9221-9798b21a47b2-187534335af7fdcf.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/0708a3d1-c6b8-4097-9221-9798b21a47b2-cbf7216c13876ecc.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/direct-to-camera-0708a3d1-c6b8-4097-9221-9798b21a47b2",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Direct-to-Camera product video with a natural, social-first performance and a clear call to action."
  },
  {
    "id": "direct-to-camera-a254d42a-4d6d-4787-b973-a4a579994543",
    "name": "Direct-to-Camera",
    "url": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_video_preset/a254d42a-4d6d-4787-b973-a4a579994543-74ea5a90c5936b4c.mp4",
    "poster": "https://d29nkk4626dxhc.cloudfront.net/marketing_studio_preset_thumbnails/a254d42a-4d6d-4787-b973-a4a579994543-5bca179d395511e7.jpg",
    "source": "https://higgsfield.ai/marketing-studio/preset/direct-to-camera-a254d42a-4d6d-4787-b973-a4a579994543",
    "category": "TikTok",
    "mode": "ugc",
    "direction": "Follow this official Higgsfield TikTok template structure, keeping the selected product accurate and the creator natural.",
    "defaultPrompt": "Create a Direct-to-Camera product video with a natural, social-first performance and a clear call to action."
  }
] as const satisfies ReadonlyArray<HiggsfieldVideoPreset>;
