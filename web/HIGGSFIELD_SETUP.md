# Higgsfield Marketing Studio

The web Studio supports live Marketing Studio ad presets for the Standard and HD image models. Add a product photo, choose a layout, describe the campaign, then generate. Presets are loaded from Higgsfield rather than hardcoded. Images without previews remain selectable. Preset enhancement adds 10% to the underlying image price before conversion to app credits.

Set `HF_CREDENTIALS=key-id:key-secret` in `web/.env.local` and in the deployment environment, then restart the server. Obtain API credentials and fund the separate API balance at https://open.higgsfield.ai. Never put this credential in browser or iOS configuration.

Existing authenticated generation, job polling, credit charging, refunds, and library saving are reused. No database migration is needed.

Verification with real generation requires configured credentials and a funded Higgsfield API account. Both the web Studio and iOS Studio expose the live preset catalog. In iOS, choose Image mode with Standard or HD, add a product photo, and tap “Modèles Marketing Studio”. Creator photos use the separate influencer workflow; layouts apply to product-only generation.
