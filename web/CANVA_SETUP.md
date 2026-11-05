# Canva template generation

The web Templates page now has a Canva section. Connect Canva, choose an accessible brand template, supply its tagged text and image fields, then generate a PNG. Images can be uploaded or selected from the existing Studio library. The first page is exported, copied to InsForge Storage, and added to the existing persisted asset library with both URL and storage key.

## Activate

1. Create an app in the Canva Developer Portal. Enable the REST APIs under Outside Canva.
2. Enable scopes: `asset:read asset:write brandtemplate:meta:read brandtemplate:content:read design:content:read design:content:write design:meta:read`.
3. Register the exact callback URL, e.g. `https://your-domain/api/canva/callback`.
4. Set the server variables in `.env.example`: `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REDIRECT_URI`, and `CANVA_COOKIE_KEY`. Generate the key with `openssl rand -hex 32`. Keep secrets out of source control and the key stable across deployments.
5. In Canva, prepare single-page designs with Bulk Create > Labels data fields. Use text and image fields only, e.g. PRODUCT_IMAGE, HEADLINE, PRICE, LOGO. Publish as brand templates.
6. Optionally set `CANVA_TEMPLATE_IDS` to comma-separated curated brand template IDs. This enforces the library but does not grant users access in Canva.
7. Restart the app. Sign in, open Templates, connect an eligible Canva account, choose a template, fill every field, and generate.

## Account model

Each connected user needs a Canva plan eligible for brand templates and Autofill and access to the selected template. This implementation does not share an administrator account across customers. A common curated library needs supported template access arranged in Canva; an allowlist alone does not provide that access. Complete Canva's applicable distribution/review requirements before public availability.

Tokens are encrypted using AES-256-GCM in an HttpOnly, SameSite=Lax, Secure (production) cookie bound to the Studio user. OAuth uses PKCE, state, and a ten-minute expiry. Connections are specific to a browser, expire after 30 days without use, and refresh on API requests. Disconnect removes this browser's connection; users can revoke app access in Canva. Concurrent expired-token requests should be avoided because refresh tokens rotate.

Generation uses selected images and entered text. It does not invoke an additional paid AI request. Generate a photo in Studio first, then choose it in a template image field. Automatic AI copy, multi-page output, cross-device connection persistence, and iOS UI are outside this initial integration.

## Verify

From `web/`: `node --test tests/canva.test.mjs tests/production-boundaries.test.mjs`, `npx tsc --noEmit`, and `npm run build`.

Live acceptance requires Canva credentials and an accessible tagged template: connect; cancel/retry authorization; upload a photo; select an existing generated photo; fill text; generate; check the saved PNG in Assets; disconnect. Test access errors with an ineligible Canva account too.

References: https://www.canva.dev/docs/apps/rest-apis/authentication/ and https://www.canva.dev/docs/apps/rest-apis/autofill-guide/.
