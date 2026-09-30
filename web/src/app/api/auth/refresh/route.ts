import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

/** Browser refresh endpoint for the short-lived access token (refresh token stays httpOnly). */
export const { POST } = createRefreshAuthRouter();
