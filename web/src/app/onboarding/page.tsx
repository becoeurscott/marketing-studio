"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StepDots } from "@/components/ui/ProgressIndicator";
import { useHydrated, useStore } from "@/lib/store";
import type { OnboardingAnswers, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

type StepDef =
  | { key: "creating" | "role" | "goal"; title: string; subtitle: string; options: string[]; multiple: false }
  | { key: "wants" | "platforms"; title: string; subtitle: string; options: string[]; multiple: true };

const STEPS: StepDef[] = [
  { key: "creating", title: "What are you creating?", subtitle: "We'll tailor your studio around it.", options: ["Product", "Brand", "Content", "Ads", "Campaigns", "Other"], multiple: false },
  { key: "role", title: "What best describes you?", subtitle: "Helps us pick the right templates.", options: ["Founder", "Marketer", "Creator", "Agency", "Freelancer", "E-commerce seller"], multiple: false },
  { key: "wants", title: "What do you want to create?", subtitle: "Pick as many as you like.", options: ["Images", "Videos", "Ads", "Social content", "Full campaigns"], multiple: true },
  { key: "platforms", title: "Where will it live?", subtitle: "Choose your platforms.", options: ["Instagram", "TikTok", "Facebook", "YouTube", "Google", "Pinterest"], multiple: true },
  { key: "goal", title: "What's your biggest goal?", subtitle: "One thing we should optimize for.", options: ["More sales", "More content", "Brand awareness", "Save time", "Scale marketing"], multiple: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const answers = useStore((s) => s.onboarding);
  const setAnswers = useStore((s) => s.setOnboardingAnswers);
  const complete = useStore((s) => s.completeOnboarding);
  const done = useStore((s) => s.onboardingDone);
  const user = useStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (hydrated && done && !finished) router.replace("/home");
  }, [hydrated, done, finished, router]);

  const current = STEPS[step];
  const value = answers[current.key];
  const canContinue = current.multiple ? (value as string[]).length > 0 : !!value;

  const select = (opt: string) => {
    if (current.multiple) {
      const list = value as string[];
      const next = list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt];
      setAnswers({ [current.key]: current.key === "platforms" ? (next.map((p) => p.toLowerCase()) as Platform[]) : next } as Partial<OnboardingAnswers>);
    } else {
      setAnswers({ [current.key]: opt } as Partial<OnboardingAnswers>);
    }
  };
  const isSelected = (opt: string) =>
    current.multiple ? (value as string[]).map((v) => v.toLowerCase()).includes(opt.toLowerCase()) : value === opt;

  const next = () => {
    if (step < STEPS.length - 1) { setDir(1); setStep(step + 1); }
    else { setFinished(true); complete(); }
  };
  const back = () => { if (step > 0) { setDir(-1); setStep(step - 1); } };

  if (!hydrated) return <div className="min-h-dvh bg-bg" />;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full bg-accent2/20 blur-[140px]" />
      </div>

      <header className="relative flex items-center justify-between h-16 px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="size-7 rounded-md bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-glow">
            <Sparkles className="size-4 text-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Marketing Studio</span>
        </div>
        {!finished && <span className="text-xs text-muted">Step {step + 1} of {STEPS.length}</span>}
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center px-5 pb-32">
        <AnimatePresence mode="wait" custom={dir}>
          {finished ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center max-w-md"
            >
              <motion.div
                className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-glow mb-6"
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              >
                <Check className="size-8 text-white" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your studio is ready.</h1>
              <p className="text-text2 mt-3">
                {user.name.split(" ")[0]}, we set up templates for {answers.wants.slice(0, 2).join(" and ").toLowerCase() || "your work"} on {answers.platforms.slice(0, 2).map((p) => p[0].toUpperCase() + p.slice(1)).join(" and ") || "your platforms"}.
              </p>
              <Button size="lg" className="mt-8" rightIcon={<ArrowRight className="size-4" />} onClick={() => router.replace("/home")}>
                Enter the studio
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={current.key}
              custom={dir}
              initial={{ opacity: 0, x: dir * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-xl"
            >
              <StepDots total={STEPS.length} current={step} className="mb-8" />
              <h1 className="text-3xl md:text-[40px] font-bold tracking-tight leading-[1.05]">{current.title}</h1>
              <p className="text-text2 mt-2">{current.subtitle}</p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {current.options.map((opt, i) => {
                  const selected = isSelected(opt);
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => select(opt)}
                      aria-pressed={selected}
                      className={cn(
                        "h-14 rounded-lg border text-sm font-medium transition-all text-left px-4 flex items-center justify-between",
                        selected ? "bg-accent/15 border-accent/60 text-text shadow-glow" : "bg-card border-border-strong text-text2 hover:text-text hover:border-white/25",
                      )}
                    >
                      {opt}
                      {selected && <Check className="size-4 text-highlight" />}
                    </motion.button>
                  );
                })}
              </div>

              {current.multiple && (value as string[]).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(value as string[]).map((v) => <Chip key={v} size="sm" selected label={v[0].toUpperCase() + v.slice(1)} onClick={() => select(v)} />)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!finished && (
        <footer className="fixed bottom-0 inset-x-0 z-10 p-4 md:px-8 md:py-6 bg-gradient-to-t from-bg via-bg/90 to-transparent pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0} leftIcon={<ArrowLeft className="size-4" />}>Back</Button>
            <Button onClick={next} disabled={!canContinue} rightIcon={<ArrowRight className="size-4" />} size="lg">
              {step === STEPS.length - 1 ? "Finish" : "Continue"}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
