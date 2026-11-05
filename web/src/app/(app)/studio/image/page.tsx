import { redirect } from "next/navigation";

/** Keep existing image-generator links working while using the main Studio. */
export default async function ImageGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "mode" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  query.set("mode", "image");
  redirect(`/studio?${query}`);
}
