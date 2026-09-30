/**
 * Seedance 2.5 text-to-video example (Higgsfield SDK).
 * Run: npm run seedance   (loads HF_CREDENTIALS from .env.local; never printed)
 */
import { config, higgsfield, HiggsfieldError } from "@higgsfield/client/v2";

if (!process.env.HF_CREDENTIALS) {
  console.error("HF_CREDENTIALS is missing. Add it to web/.env.local as key-id:key-secret.");
  process.exit(1);
}

// Video renders can take several minutes: poll every 5 s for up to 15 min.
config({ credentials: process.env.HF_CREDENTIALS, pollInterval: 5_000, maxPollTime: 15 * 60_000 });

try {
  const result = await higgsfield.subscribe("bytedance/seedance-2.5/text-to-video", {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    },
    withPolling: true,
  });

  // The API may also report "canceled" even though the SDK type doesn't list it.
  const status = result.status as string;
  if (status === "completed" && result.video?.url) {
    console.log(`Completed (request ${result.request_id})`);
    console.log(result.video.url);
  } else if (status === "nsfw") {
    console.error(`Rejected by moderation (request ${result.request_id}). No video was produced.`);
    process.exitCode = 1;
  } else {
    console.error(`Generation did not complete: status "${status}" (request ${result.request_id}).`);
    process.exitCode = 1;
  }
} catch (error) {
  // SDK errors: AuthenticationError, NotEnoughCreditsError, ValidationError, TimeoutError, …
  const name = error instanceof HiggsfieldError ? error.constructor.name : "Error";
  console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
