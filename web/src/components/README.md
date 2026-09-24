# Marketing Studio — component & architecture guide

Frontend-only Next.js 16 (App Router) prototype. Everything is client-side, mock data + a persisted zustand store. This doc is for agents building the remaining feature pages.

## Layout of `src/`

```
app/
  layout.tsx            Root: Inter font, globals.css, <ToastProvider>
  page.tsx              "/" → redirects to /onboarding or /home (client, after hydration)
  onboarding/page.tsx   5-step onboarding (outside the shell)
  (app)/layout.tsx      Hydration guard + onboarding redirect, wraps pages in <AppShell>
  (app)/<route>/page.tsx  One file per route in SPEC. Home + Projects are done; others are placeholders
components/
  ui/        Design-system primitives (see list below). Import from "@/components/ui" or the file.
  shell/     AppShell, Sidebar, TopBar, MobileNav, PageHeader/Section, ShellContext (Inspector, usePageTitle)
  projects/  ProjectCard, ProjectFormModal (new/edit)
  studio/    Studio canvas: `Composer` (floating media-slots + inline-chip prompt + pill row, image/video/ugc), `StudioCanvas`, `StudioTopBar`, `ModeTabs`, pickers, generator hooks
data/        Mock data (seeded once into the store). Import for read-only reference data (templates, creators, plans, hooks, tones…)
lib/
  types.ts   All domain types + constants (PLATFORMS, IMAGE_STYLES, RATIOS, CREDIT_COSTS)
  store.ts   zustand store (persist → localStorage key `ms-store`), `useHydrated()`, selectors
  api.ts     Mock async API (delays, progress callbacks, credit deduction)
  utils.ts   cn(), uid(), img(seed,w,h), avatar(n), formatDate, timeAgo, formatNumber, daysAgo
```

## Design tokens (Tailwind v4 `@theme` in `app/globals.css`)

Colors: `bg`, `surface`, `card`, `elevated`, `border`, `border-strong`, `accent`, `accent2`, `highlight`, `success`, `warning`, `danger`, `text`, `text2`, `muted`
→ use as `bg-card`, `text-text2`, `border-border-strong`, `bg-accent/15`, etc. **Never hardcode hex in components.**
Radius: `rounded-xs|sm|md|lg|xl|2xl`. Shadows: `shadow-card`, `shadow-float`, `shadow-glow`.
Accent is for primary actions + selection only. Everything else stays neutral.

## UI primitives (`components/ui`)

| Component | Notes |
|---|---|
| `Button` | `variant` primary/secondary/ghost/danger · `size` sm/md/lg · `loading` · `leftIcon`/`rightIcon` · `fullWidth` |
| `IconButton` | requires `label` (aria) · `variant` ghost/solid/outline · `active` |
| `Card`, `CardHeader` | `padded` (default true), `interactive`, `elevated` |
| `Badge`, `statusTone(status)` | tones neutral/accent/success/warning/danger/outline · `dot` |
| `Input`, `Textarea`, `Select` | `label`, `hint`, `error`; Input has `leftIcon`/`rightSlot`; Select has `options[]`, `compact` |
| `Chip`, `ChipGroup` | ChipGroup is single (`value: T`) or `multiple` (`value: T[]`) — typed generically |
| `Tabs` | `items[{value,label,count?,icon?}]`, `variant` underline/pill, pass a unique `layoutId` if two Tabs are on one page |
| `Modal` | framer-motion, portal, Esc closes, `size` sm/md/lg/xl, optional `footer` |
| `Drawer` | side panel, `side` right/left, `width` |
| `BottomSheet` | mobile sheet (drag to dismiss); centered panel on md+ |
| `ToastProvider` / `useToast()` | `toast.success(title, desc)`, `.error`, `.info`, or `toast.toast({ title, action })` — provider is already in root layout |
| `Skeleton`, `SkeletonCard`, `SkeletonGrid` | shimmer placeholders |
| `EmptyState` | `icon` (lucide), `title`, `description`, `cta {label, href|onClick}`, `compact` — every section needs one |
| `ProgressBar`, `StepProgress`, `StepDots` | bar with %, step list (video pipeline), wizard dots |
| `CreditBadge` | reads credits from store, links to /credits, warns when < 200 |
| `SearchBar` | controlled `value/onChange` |
| `FilterBar` | chip row with counts + optional `right` slot |
| `Tooltip` | CSS-only hover tooltip |
| `Avatar` | `src`, `name` (initials fallback), `size` |

Conventions: `"use client"` on anything with state/handlers; `cn()` for classes; lucide icons at `size-4` inside buttons; `<img>` (not next/image) for picsum/pravatar URLs (`img()` / `avatar()` helpers).

## App shell

`(app)/layout.tsx` already wraps pages in `<AppShell>`. Inside a page you can:

- **Set the TopBar title:** `usePageTitle(project.name)` from `@/components/shell/ShellContext`.
- **Render the right Inspector (desktop ≥ lg):**
  ```tsx
  import { Inspector } from "@/components/shell/ShellContext";
  <Inspector><div className="p-4">…controls…</div></Inspector>
  ```
  It portals into the 320px right column and shows it only while mounted. On mobile provide the same controls in a `BottomSheet` (the Studio floating bar should open it).
- **Page heading:** `<PageHeader title description actions eyebrow />` and `<Section title description action>` from `@/components/shell/PageHeader`.
- Nav items live in `shell/nav.ts` (`primaryNav`, `secondaryNav`, `routeTitles`). Add a route title there if you add a route.
- Mobile: bottom `MobileNav` (Home, Studio, Projects, Assets, More→sheet). Content has `pb-24` on mobile so nothing hides behind it.
- **Immersive pages:** `useImmersive()` (Studio) removes the main padding and hides the TopBar on mobile so a canvas can go full-bleed; the page then owns its own thin bar/height (`h-[calc(100dvh-3.5rem)]`).

## Store (`lib/store.ts`)

`useStore(selector)` — always select a primitive or an existing array/object reference. **Do not return a new array from a selector** (`useStore(s => s.assets.filter(...))` causes re-render loops in zustand v5); select `s.assets` then filter in the component or `useMemo`.

State: `user, onboardingDone, onboarding, projects, assets, campaigns, generations, favorites{asset,template,prompt,creator}, brands, currentBrandId, credits, transactions, notifications, members, workspaceName, preferences, currentProjectId, plan`.

Actions:
- user/onboarding: `updateUser(patch)`, `setOnboardingAnswers(patch)`, `completeOnboarding()`
- projects: `addProject({name,description?,brandId?})→Project`, `renameProject(id,name)`, `updateProject(id,patch)`, `duplicateProject(id)→Project|undefined`, `archiveProject(id,archived=true)`, `deleteProject(id)` (cascades assets/campaigns/generations), `setCurrentProject(id|null)`
- favorites: `toggleFavorite(kind,id)`, `isFavorite(kind,id)` — kinds: asset | template | prompt | creator
- assets: `addAsset(partial)→Asset`, `updateAsset(id,patch)`, `deleteAsset(id)`
- generations: `addGeneration(partial)→Generation`, `updateGeneration(id,patch)`
- campaigns: `createCampaign(input)→Campaign`, `updateCampaign(id,patch)`, `deleteCampaign(id)`, `addCalendarItem(campaignId,item)`, `updateCalendarItem(campaignId,itemId,patch)`, `removeCalendarItem(campaignId,itemId)`
- brand: `updateBrand(id,patch)`, `addBrand({name,…})`, `deleteBrand(id)`, `setCurrentBrand(id)`, `updateBrandVoice(id,patch)`
- credits: `spendCredits(action,amount,description)→boolean`, `buyCredits(amount,description?)`
- notifications: `markNotificationRead(id,read=true)`, `markAllNotificationsRead()`, `pushNotification({kind,title,body,href?})`
- workspace: `inviteMember({name,email,role})`, `removeMember(id)`, `changeMemberRole(id,role)`, `setWorkspaceName(name)`
- prefs/plan: `setPreference(key,value)`, `setPlan(planId)`, `reset()`

Selectors: `selectUnreadCount`, `selectCurrentBrand`, `selectProject(id)`, `selectProjectAssets(id)`.

Hydration: the store uses `skipHydration`. `(app)/layout.tsx` calls `useHydrated()` and shows a boot skeleton until localStorage is loaded, so pages under `(app)` can read the store freely. Pages **outside** the shell (onboarding, `/`) must call `useHydrated()` themselves. Bump `SEED_VERSION` in store.ts to force a re-seed for everyone.

## Mock API (`lib/api.ts`)

All functions are async, take 0.6–2.5s, deduct credits via `spendCredits` (throw `ApiError("insufficient-credits")` when short) and record a `Generation`. Wrap calls in try/catch and surface `err.message` via toast.

```ts
delay(ms=800, max?)                                  // sleep helper
generateImage({prompt, style?, ratio?, background?, lighting?, camera?, composition?, productAssetId?, projectId?, count?=4}) → ImageResult[4]
generateVideo({concept, durationSec:5|10|15, ratio?, camera?, style?, sourceAssetId?, sourceUrl?, projectId?}, onProgress?(step, index, pct)) → VideoResult   // steps: VIDEO_STEPS
generateUGC({creatorId, script, durationSec, location?, tone?, productAssetId?, projectId?}, onProgress?) → VideoResult
generateProductShoot({productUrl, environment, lighting, camera, count?=6, projectId?}) → ImageResult[]
generateAds({platform, format, product, offer, audience, cta, projectId?}) → AdVariation[4]   // labels A–D
generateCopy({tool, product, audience, tone, goal, platform?, projectId?}) → CopyResult        // uses current brand voice
generateHooks({product, audience?, tone?, projectId?}) → string[10]
createCampaign({name, projectId, objective, audience, platforms, formats}, onProgress?(label, pct)) → Campaign   // adds to store + notification
exportAssets({assetIds, format:"png"|"jpg"|"mp4"|"pdf", quality:"standard"|"high"|"maximum", campaignId?}, onProgress?(pct,label)) → Asset (type "export")
upscaleImage({url, assetId?, projectId?}) → ImageResult
uploadProduct({name, size?, projectId?}, onProgress?(pct)) → Asset
assistantReply(message) → {text, actions[]}
ratioToSize(ratio) → [w,h]
```

Credit costs: `CREDIT_COSTS` in types.ts (image 10, video 50, upscale 15, copy 2, ads 20, ugc 60, product-shoot 30).

## Adding a feature page

1. Replace the placeholder in `app/(app)/<route>/page.tsx` (keep `"use client"`).
2. Read from the store with narrow selectors; reference data (templates, creators, plans, COPY_TOOLS, TONES, hooks) from `@/data`.
3. Use `PageHeader` + `Section`, primitives above, and an `EmptyState` for every empty list.
4. Loading: `Skeleton*` while a mock API call runs; `StepProgress` for video steps; `ProgressBar` for export.
5. Errors: catch `ApiError`, `toast.error("Something went wrong.", err.message)` and offer Try again / Back to Studio.
6. Desktop controls → `<Inspector>`; mobile → `BottomSheet`. Studio pages should keep the canvas dominant.
7. Dynamic routes: use `useParams<{ id: string }>()` from `next/navigation` (client pages).
8. Run `npm run build` — zero TS/ESLint errors is the bar. The `react-hooks/set-state-in-effect` rule is on: reset form state with a `key` (see `ProjectFormModal`) instead of `useEffect` + `setState`.
