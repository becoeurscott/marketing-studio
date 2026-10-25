import Link from "next/link";
import { HiggsfieldExamples } from "@/components/studio/HiggsfieldExamples";

export default function HiggsfieldExamplesPage() {
  return (
    <main className="min-h-screen bg-[#030304] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/studio?mode=video" className="text-sm text-accent underline">Ouvrir le Studio →</Link>
        <HiggsfieldExamples />
      </div>
    </main>
  );
}
