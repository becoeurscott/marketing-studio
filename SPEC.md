# MARKETING STUDIO — Product Spec

Turn a product idea into a complete marketing campaign.
IDEA → CONCEPT → CREATE → REFINE → CAMPAIGN → EXPORT

Frontend-only prototype (web: Next.js; iOS: SwiftUI). NO real backend, NO real AI/payment APIs. Everything uses mock data and mock async functions with simulated delay, architected so real APIs can be plugged in later. Must feel like a real production app. Original identity: dark creative workspace inspired by modern AI creative tools (large canvas, floating controls, compact toolbars) but NOT a copy of Higgsfield or Canva.

## Target users
Small business owners, e-commerce sellers, content creators, agencies, freelancers, social media managers, entrepreneurs, product brands.

## Color system
bg #070707 · secondary #101010 · card #151515 · elevated #1C1C1C · border rgba(255,255,255,0.08)
accent #A855F7 · accent2 #7C3AED · highlight #C084FC
success #22C55E · warning #F59E0B · danger #EF4444
text #FFFFFF · text2 #A1A1AA · muted #71717A
Use accent sparingly; app stays mostly dark/neutral.

## Typography
Modern sans-serif. Headings large, bold, tight tracking. Body clean, medium contrast. Controls compact, medium weight.

## Global structure
Desktop: left sidebar · main workspace · optional right inspector.
Mobile: top bar · canvas · bottom action bar · bottom sheets.
Main nav: HOME, STUDIO, PROJECTS, ASSETS, CAMPAIGNS, TEMPLATES, BRAND, SETTINGS.

## Screens
8. HOME: "Good morning, Alex." / "What are we creating today?" / CTA "Create something". Sections: Recent Projects, Continue Creating, Templates, Trending Formats, Recent Assets. Stats: Projects, Assets, Campaigns, Credits. Example projects: Summer Skincare Campaign, Urban Coffee Launch, Nike-Inspired Fitness Campaign, Luxury Watch Campaign, New Product UGC Ads.
9. STUDIO (core): Top bar (logo, project name, save status, undo, redo, share, export). Main canvas dominant: empty → "Start creating", "Drop product image here", buttons Upload Product / Start From Prompt; with asset → show image/video with Zoom, Fit, Fullscreen. Bottom floating generation bar: [Upload][Prompt][Style][Model][Ratio][Generate]. Prompt placeholder "Create a luxury product advertisement for this perfume...".
10. Modes tabs: IMAGE, VIDEO, ADS, COPY, CAMPAIGN.
11. IMAGE GENERATOR: inputs Product, Prompt, Style, Aspect Ratio, Background, Lighting, Camera, Composition. Styles: Product Photography, Luxury, Minimal, Street, Lifestyle, Editorial, Cinematic, UGC, Studio, Fashion, Food, Tech. Ratios: 1:1, 4:5, 9:16, 16:9, 3:2.
12. IMAGE RESULTS: gallery of 4 mock outputs; each: Download, Favorite, Edit, Upscale, Regenerate, Use in Campaign. Select one → highlighted.
13. IMAGE EDITOR: tools Crop, Resize, Remove Background, Replace Background, Relight, Retouch, Add Text, Add Logo, Expand Image. Inspector: Prompt, Strength, Aspect ratio. Apply Changes.
14. VIDEO GENERATOR: source image, concept, duration (5/10/15s), ratio, camera (Slow zoom, Orbit, Handheld, Push in, Pull out, Tracking, Static), style (UGC, Commercial, Cinematic, Product demo, Lifestyle). Progress states: Preparing assets → Generating scenes → Rendering → Finalizing → mock player.
15. UGC CREATOR: product, creator (Maya, Jordan, Sofia, Marcus), script, location, tone (Excited, Casual, Professional, Funny, Luxury, Authentic), duration. Show creator preview, product preview, script, generated video. CTA "Generate UGC Video".
16. AI PRODUCT SHOOT: upload one photo; environment (Luxury bathroom, Modern kitchen, Beach, Office, Street, Studio, Restaurant, Gym, Car interior); lighting (Natural, Golden hour, Studio, Neon, Softbox, Dramatic); camera (Close-up, Medium, Wide, Macro). Output multiple photos.
17. AD CREATOR: platform (TikTok, Instagram, Facebook, YouTube, Google, Pinterest); format (Image, Video, Carousel, Story, Reel, Short); Product, Offer, Target audience, CTA. Example: Premium Watch / Men 25–40 / 20% launch discount / Shop Now.
18. AD VARIATIONS: Creative A–D each with Visual, Headline, Primary text, CTA; actions Edit, Duplicate, Save, Export.
19. COPYWRITER: tools Ad Copy, Product Description, Instagram Caption, TikTok Caption, Email, Headline, Hook, CTA, UGC Script, Landing Page Copy. Inputs Product, Audience, Tone, Goal. Tones: Professional, Friendly, Luxury, Bold, Funny, Minimal, Urgent.
20. HOOK GENERATOR: "Generate 10 hooks"; results like "Nobody tells you this about...", "You've been using this wrong...", "POV: you finally found..."; each Copy / Save / Use in Script.
21. CAMPAIGN BUILDER (5 steps): objective (Awareness, Engagement, Leads, Sales) → audience → platforms (Instagram, TikTok, Facebook, YouTube) → formats (Product photos, UGC, Video ads, Stories, Carousels) → Generate. Then dashboard: name, status, assets, platforms, variations.
22. CAMPAIGN WORKSPACE: header (name, status Draft), tabs Overview, Assets, Ads, Videos, Copy, Calendar, Analytics. Asset grid.
23. CONTENT CALENDAR: Week/Month views; items with platform, format, status (Draft/Scheduled/Published), asset. No real publishing.
24. PROJECTS: cards (thumbnail, name, created, asset count, status); filters All/Active/Archived; search.
25. PROJECT DETAIL: name, description, brand, created; tabs Overview, Assets, Generations, Campaigns; Rename, Duplicate, Archive, Delete.
26. ASSET LIBRARY: types Images, Videos, Audio, Logos, Brand assets, Exports; grid; filters Type/Date/Project/Favorite; search; per asset Preview, Download, Rename, Move, Favorite, Delete.
27. TEMPLATES: categories Product Ads, UGC, Social Media, E-commerce, Fashion, Beauty, Food, Technology, Real Estate, Fitness. Card: thumbnail, title, platform, format. Examples: Luxury Product Launch, 15-Second UGC Ad, New Product Reel, Black Friday Campaign.
28. TEMPLATE DETAIL: large preview, name, description, platforms; "Use Template" → opens Studio preconfigured.
29. BRAND KIT: name, logo, colors, fonts, website, description, industry, audience; assets (primary logo, icon, product images); add/edit/delete brand.
30. BRAND VOICE: tone (Luxury, Friendly, Bold, Playful, Professional); writing style e.g. "Short sentences. Confident. Never overly formal." Used in generated copy.
31. CREATORS: cards image, name, gender, age range, style, languages. Maya 24 Lifestyle; Jordan 29 Fitness; Sofia 27 Beauty; Marcus 31 Tech. Fictitious.
32. AI ASSISTANT (in Studio): chat with mock responses; suggested actions Generate Campaign, Generate Product Shoot, Generate UGC, Write Ad Copy, Generate Video.
33. GENERATION HISTORY: thumbnail, prompt, type, date, project, status; filters Images/Videos/Copy/Ads.
34. FAVORITES: assets, templates, prompts, creators.
35. EXPORT CENTER: PNG/JPG/MP4/PDF; quality Standard/High/Maximum; export selected / export campaign; mock progress.
36. CREDITS: 1,250 remaining; costs Image 10, Video 50, Upscale 15; usage history; buy credits (mock).
37. PRICING: Starter $12, Creator $29, Studio $59, Agency $149 /month. Features: AI generations, Projects, Brand Kits, Campaigns, Video generations, Team members. Pricing page, upgrade modal, paywall state, success screen. No Stripe.
38. NOTIFICATIONS: Generation complete, Campaign ready, Export complete, Credits low, New template, Project shared.
39. PROFILE: avatar, name, email, company; stats Projects/Assets/Campaigns.
40. SETTINGS: Account, Workspace, Notifications, Appearance, Brand, Subscription, Security, Help.
41. WORKSPACE/TEAM: workspace "Marketing Studio"; members Alex, Sarah, Michael; roles Owner/Admin/Editor/Viewer; invite/remove/change role.
42. ONBOARDING: 5 screens — What are you creating? (Product, Brand, Content, Ads, Campaigns, Other) · Role (Founder, Marketer, Creator, Agency, Freelancer, E-commerce seller) · What do you want to create? (Images, Videos, Ads, Social content, Full campaigns) · Platforms (Instagram, TikTok, Facebook, YouTube, Google, Pinterest) · Biggest goal (More sales, More content, Brand awareness, Save time, Scale marketing) → "Your studio is ready."
43. EMPTY STATES for every section (icon, explanation, CTA). 44. LOADING: skeletons; "Creating your visual..."; video steps "Building scene 1...", "Adding motion...", "Rendering...", "Finalizing...". 45. ERRORS: "Something went wrong." Try Again / Back to Studio.
46. MOBILE: top nav, large canvas, floating generation bar [media][prompt][model][duration][ratio][generate], bottom sheets. 47. DESKTOP: sidebar / canvas / inspector.

## Mock data (centralized, /data)
users, projects, assets, campaigns, templates, creators, generations, brand, notifications, copy, analytics, credits.
At least: 10 projects, 50 assets, 20 templates, 15 creators, 30 generations, 10 campaigns, 20 notifications.

## Sample user / product / campaign
User: Alex Carter · Northstar Creative · Founder · Brand: Luma Skin (Beauty) · goal: increase online sales · platforms Instagram, TikTok, Facebook · 1,250 credits · recent project "Luma Skin Summer Launch".
Product: Luma Glow Serum · Skincare · $48 · "Vitamin C brightening serum designed for everyday skincare routines." · audience women and men 20–35 · brand style Premium, Clean, Modern, Minimal.
Campaign: Luma Glow Summer Launch · objective sales · Instagram/TikTok/Facebook · formats Product Photography, UGC, Short Video, Story, Carousel.

## Routes (web)
/ /onboarding /home /studio /studio/image /studio/video /studio/ugc /studio/product-shoot /studio/ads /studio/copy /projects /projects/[id] /assets /assets/[id] /templates /templates/[id] /campaigns /campaigns/[id] /campaigns/[id]/calendar /brand /brand/voice /creators /generations /favorites /credits /pricing /notifications /workspace /profile /settings /help

## Interaction & persistence
Buttons do things: Upload → mock upload modal; Generate → loading → mock results; Favorite updates; Use Template → Studio; Create Campaign → creates; Save → saved state; Export → progress.
Persist (localStorage / UserDefaults): projects, favorites, brand, selected path, recent generations, campaigns, credits, prefs.

## UX principle
The user should never wonder "what do I do next?" Upload → Choose creative → Generate → Review → Refine → Add to campaign → Export.
Feel: AI creative studio + asset workspace + marketing tool + copywriter + campaign manager, with its own identity.
