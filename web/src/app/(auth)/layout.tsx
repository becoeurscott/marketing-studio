import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="fr" className="min-h-dvh bg-bg text-text flex flex-col">
      <header className="px-4 sm:px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight text-[17px]">
          <img src="/brand-mark.png" alt="" aria-hidden="true" className="size-8 rounded-lg" />
          Marketing Studio
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
