# Marketing Studio — production readiness review

Reviewed September 23, 2026. Scope: the SwiftUI iOS app and Next.js web app in this repository. This is a source review and local build assessment, not a penetration test or App Store approval certification.

**Release decision: not ready for paying customers or App Store submission.** Both clients are explicitly frontend prototypes. The screens cover many workflows, but there is no production service implementing the core product. A successful build would establish compilation only.

## Confirmed blockers

P0 means a blocker for the advertised paid product. P1 means required production hardening.

| Priority | Finding and evidence | Required outcome |
| --- | --- | --- |
| P0 | AI generation is simulated: `ios/MarketingStudio/MockAPI.swift:134` and `web/src/lib/api.ts`. Video results use images rather than generated playable media. | Real provider jobs, durable results, real playback, useful failure handling. No mock fallback reported as successful generation. |
| P0 | Photo selection ignores the selected photo bytes: `ios/MarketingStudio/Views/Studio/UploadProductSheet.swift:52`. Web upload accepts file metadata and substitutes a stock image: `web/src/lib/api.ts:261`. | Import the actual image; validate type, size and dimensions; preserve it through upload, generation and reopening the project. |
| P0 | iOS Download reports “Saved to Files” without writing a file: `ios/MarketingStudio/Views/Screens/ExportCenterView.swift:250`. The export service is simulated. | Produce the requested file type and present a working share/save flow. Verify exported bytes in another app. |
| P0 | Credits and plans are editable client state: `ios/MarketingStudio/AppStore.swift:471`, `:483`, `Views/Screens/PricingView.swift:211`, and `web/src/lib/store.ts`. Purchase success follows a delay, not a transaction. | Server-owned balances and entitlements; verified purchases; atomic charging, retry protection and failure reconciliation. |
| P0 | Security controls are cosmetic: `ios/MarketingStudio/Views/Screens/SettingsView.swift:87`. There is no real login service; Profile sign-out resets the demo. | Implement real authentication, session revocation and recovery; expose only security controls that actually work. |
| P0 | Copy contains invented product facts, performance promises and review counts: `web/src/lib/api.ts:295`. Campaign creation hardcodes “Luma Glow Serum” even for other products. | Ground results in the selected product and verified facts. Never invent testimonials, discounts, ingredients or performance evidence. |
| P0 | App icon contains no image filename. `ios/project.yml` has an empty development team and an ad-hoc signing identity. | Final icon, owned bundle identifier, distribution signing and validated device archive. The current configuration is not evidence of submission readiness. |
| P1 | All workspace data lives in local JSON (`UserDefaults` / browser `localStorage`). Workspace membership is local state. | Durable storage, backups, migrations and server-enforced access control. Local caches must not authorize billing or shared-data access. |
| P1 | `AppStore` reads injected UserDefaults but writes/resets `.standard`; JSON decode failures silently seed demo data. | Consistent persistence dependency; explicit migration/recovery path that preserves customer work instead of silently replacing it. |
| P1 | No privacy manifest was found in the source inventory despite UserDefaults usage. | Inventory required-reason APIs and SDKs, add accurate declarations, and inspect the final archive. Do not invent privacy answers before services are selected. |
| P1 | No automated test target or test script was found in the inspected project configuration. Multiple generated Xcode projects exist. | Choose one canonical generated project, reproducible CI, and critical workflow tests before release. |

These are observed prototype limitations, not evidence that a deployed service has been compromised. A dependency audit does not replace an application security assessment.

## First release recommendation

Use one complete customer journey as the first release gate: **create a project → import a real product photo → generate a product image and grounded copy → save → reopen → export a usable file**.

Assume iPhone first until the release preference is confirmed. Keep web on the same backend contract. Complete this journey before expanding to video, synthetic creators, team collaboration, social publishing and live campaign analytics. If those features remain advertised in version one, each must meet its own end-to-end acceptance tests; otherwise remove them from the release UI and store description. This is a scope recommendation, not an approved reduction of the requested product.

## Security and service design

The following is a proposed implementation design, not existing functionality.

1. **Identity and ownership.** Use a maintained identity service. Verify credentials on the server and derive workspace access from membership records. Test two unrelated accounts against every project, asset, job, export and membership operation. Never trust a workspace ID or role supplied by the client.
2. **Secrets and sessions.** Provider keys stay in server secret storage. Store iOS session credentials in Keychain; for web, prefer secure HTTP-only cookies with CSRF protection. Redact tokens, prompts, uploads and signed URLs from routine logs. Keep local preferences separate from sensitive customer content.
3. **Private files.** Store originals and generated files privately. Authorize each download before issuing a short-lived URL. Validate actual content, not just extensions; limit sizes and decoded image dimensions; strip unnecessary metadata. If importing remote URLs, prevent access to internal networks and validate redirects.
4. **Durable jobs.** Persist queued/running/succeeded/failed/canceled states. Make job creation idempotent; bind each job to the authenticated owner. Validate provider callbacks. Recover after app termination, network loss and worker restart. Only mark success after output files are durably stored and validated.
5. **Billing integrity.** Price work on the server, reserve credits atomically, settle once on successful delivery and release reservations on failure. Repeated requests and webhook deliveries must never double-charge or double-credit. Reconcile purchases, refunds, revocations and subscription changes with an auditable ledger.
6. **Abuse and cost controls.** Apply account and IP limits, generation concurrency caps, upload quotas and provider spending alerts. Moderate inputs and outputs. Provide an output-reporting path and a documented response process. Use licensed creator identities and recorded likeness permissions.
7. **Assistant boundaries.** Treat product documents and prompts as untrusted content. AI must not grant access, alter billing or publish content without a separately authorized operation. Make the final creative editable and require user review before publication.

Use [OWASP MASVS](https://mas.owasp.org/MASVS/) to organize mobile verification across storage, authentication, networking, platform use, code and privacy. The concrete tests above are proposed for this product; they are not a claim of MASVS compliance.

## Apple review requirements to design around

- **2.1–2.3:** Submit a complete, accurately described app with working services and reviewer access; prototypes belong in testing.
- **3.1:** Plan StoreKit for digital credits/subscriptions. External purchase rules vary by storefront and entitlement; do not assume advertising tools are automatically exempt.
- **4.8:** If adding social login, assess the equivalent privacy-preserving login requirement and its exceptions.
- **5.1:** Provide an accessible privacy policy, appropriate permissions, and explicit consent before sharing personal data with third-party AI.
- **1.2:** If adding shared user content, provide filtering, reporting, blocking and support.

These mappings come from [Apple’s App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Apple makes the final approval decision.

If account creation is added, implement in-app deletion that removes the account and associated data through the service; resetting local demo state is insufficient. Explain any necessary retention and handle Sign in with Apple token revocation when applicable. See [Apple’s account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

Inventory the actual data handled by the app and every integrated SDK/provider before completing App Store privacy disclosures. Include uploads, prompts, account identifiers, purchases, diagnostics and retention. See [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/). Review UserDefaults and future SDK usage against [required-reason API documentation](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api).

Apple currently requires Xcode 26 or later with the iOS 26 SDK or later for uploads; iOS/iPadOS deployment targets must be 13 or later. This app targets iOS 17 and the installed Xcode reports 26.6, but the final archive still needs validation. Complete the updated age-rating questionnaire. Recheck [submission requirements](https://developer.apple.com/news/upcoming-requirements/) immediately before submission.

For this product, implement StoreKit purchase, pending/canceled/error states, subscription restoration, subscription management and backend verification. Consumable credit history must reconcile through the account ledger; do not promise that StoreKit restoration recreates spent consumables. Display localized product prices from StoreKit. Reference: [Apple In-App Purchase](https://developer.apple.com/documentation/storekit/in-app-purchase).

## Quality acceptance tests

These are proposed release gates, not measured results.

| Area | Required evidence |
| --- | --- |
| Product fidelity | Test at least 30 representative products, including food, clothing, cosmetics, furniture and electronics. Preserve product shape, color, packaging and logos; flag rather than silently accept visible changes. |
| Copy grounding | Zero invented reviews, ingredients, numerical benefits or discounts in the evaluation set. Brand voice, language, audience and platform constraints must affect results. |
| Media quality | Correct ratio, dimensions, format and readable text. Human review of commercial usability; proposed target: at least 90% usable with minor edits or less. |
| Reliability | Import, generate, save, reopen and export pass after app restart, poor connectivity and backgrounding. Cancel and retry work without lost files or duplicate charges. |
| Isolation | Account A cannot list, retrieve, modify or export account B’s objects, even by changing identifiers. Removed members lose access. |
| Billing | Test successful, canceled, pending and interrupted purchases; duplicate callbacks; restore; refund; expiration; simultaneous generation requests. Ledger remains correct. |
| Accessibility | VoiceOver names and order, large Dynamic Type, contrast, Reduce Motion, keyboard avoidance, small iPhone and supported iPad layouts. |
| Performance | Measure startup, memory with large photos, job completion percentiles and export time on a real device. Show actual job status rather than timed fake progress. Set provider-specific budgets after benchmarking. |
| Deletion | Account deletion removes service records/files and provider-held data where supported; documented retained records are access-restricted. Sign-out revokes sessions without deleting projects. |

## Deployment sequence

1. **Establish a recoverable baseline:** choose the canonical Xcode project, preserve the current untracked source, lock dependencies, and configure CI for lint, type checks, builds and critical tests. Keep build output outside the iCloud-synced Desktop.
2. **Create staging:** separate service accounts, database, private storage, secrets and AI budgets. Implement schema migrations and membership authorization before uploading customer data. Exercise backup restoration.
3. **Complete the first real workflow:** replace mock calls with service interfaces; integrate identity, import, generation, persistence and export. Keep simulation confined to development/test fixtures.
4. **Add commerce and lifecycle controls:** configure App Store products, verify transactions server-side, implement deletion and AI consent, and validate failed-job reconciliation.
5. **Operational readiness:** add redacted error reporting, health checks, queue monitoring, cost alerts and support contact. Document incident response, credential rotation and a tested rollback. Backend releases must remain compatible with already-installed clients.
6. **Device beta:** produce a signed archive, distribute through TestFlight, test real iPhone/iPad devices and the acceptance matrix. Fix all P0 failures before submission.
7. **Submission:** prepare accurate screenshots from the shipping app, final icon, privacy/support/terms URLs, age rating, privacy answers and review notes. Give reviewers a working account, sufficient credits and instructions for purchases and AI generation. Keep production services available during review.
8. **Release gradually:** monitor crashes, failed jobs, billing reconciliation, support issues and cost per successful output. Have a server-side way to pause broken generation while preserving access to saved work.

## Inputs needed to implement and ship

- First-release platforms and feature scope.
- Existing backend and AI provider accounts, or an agreed provider choice and spending budget.
- Apple Developer team, owned bundle identifier and App Store Connect access through secure configuration.
- Business identity, support contact, domain, launch storefronts, pricing and content rights.

No production service, purchase flow or App Store submission has been created by this review. Application source was not modified; the review document is the deliverable.

## Verification results

| Check | Result and limits |
| --- | --- |
| iOS Release simulator build | Passed using Xcode 26.6 and iPhoneSimulator 26.5 SDK, with signing disabled. Not a signed device archive or App Store validation. |
| Simulator launch | Installed and launched on the booted iPhone 17 Pro simulator; visually verified the rendered Home screen. Existing simulator data was preserved. Other screens and complete user journeys were not interactively tested. |
| Web lint | Passed with a clean installation from the existing lockfile in an isolated temporary copy. |
| Web production build | Passed in that same temporary copy, including TypeScript checking and page generation. |
| Production dependency audit | `npm audit --omit=dev` reported zero known vulnerabilities on the review date. This excludes development dependencies and does not establish application security. |
| Test coverage | No automated behavioral tests were run; no configured test suite was found in the inspected app configurations. |

The original web checks stalled during filesystem reads from the Desktop dependency tree. A fresh temporary copy and clean dependency installation completed successfully. This supports keeping CI/build workspaces outside the synced Desktop; it does not prove the precise cause of the original stall.

Remaining verification: real-device testing, full accessibility review, network and authorization tests, AI quality evaluation, purchase sandbox tests, signed archive validation, backup/restore exercises and production monitoring checks.
