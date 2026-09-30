"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StepDots } from "@/components/ui/ProgressIndicator";
import { PaywallScreen } from "@/components/onboarding/FinishScreens";
import { AnalysisScreen, OpeningScreen, UploadScreen } from "@/components/onboarding/IntroScreens";
import { BoldnessScreen, BrandScreen, GoalScreen, PlatformsScreen, StyleScreen } from "@/components/onboarding/QuestionScreens";
import {
  AdsScreen, CalendarScreen, CampaignCardScreen, CopyScreen, FormatsScreen, FullCampaignScreen,
  GenerationScreen, PhotosScreen, UgcScreen, ValueScreen, WorkflowScreen,
} from "@/components/onboarding/RevealScreens";
import { SAMPLE_PRODUCT, type ProductInfo } from "@/components/onboarding/shared";
import { useHydrated, useStore } from "@/lib/store";
import type { CampaignObjective, PlanId } from "@/lib/types";

const STEPS = [
  "opening", "upload", "analysis", "goal", "platforms", "style", "brand", "boldness", "generation",
  "photos", "ugc", "ads", "copy", "campaign", "formats", "value", "workflow", "card", "calendar", "paywall",
] as const;
type Step = (typeof STEPS)[number];

/** Steps grouped for the progress dots (setup questions only). */
const QUESTION_STEPS: Step[] = ["goal", "platforms", "style", "brand", "boldness"];

const OBJECTIVE: Record<string, CampaignObjective> = { launch: "awareness", sell: "sales", social: "engagement", test: "engagement", auto: "sales" };

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const answers = useStore((s) => s.onboarding);
  const setAnswers = useStore((s) => s.setOnboardingAnswers);
  const complete = useStore((s) => s.completeOnboarding);
  const createCampaign = useStore((s) => s.createCampaign);
  const setPlan = useStore((s) => s.setPlan);
  const projectId = useStore((s) => s.currentProjectId ?? s.projects[0]?.id ?? null);
  const done = useStore((s) => s.onboardingDone);

  const [step, setStep] = useState<Step>("opening");
  const [history, setHistory] = useState<Step[]>([]);
  const [finished, setFinished] = useState(false);
  const [product, setProduct] = useState<ProductInfo>(SAMPLE_PRODUCT);

  useEffect(() => {
    if (hydrated && done && !finished) router.replace("/home");
  }, [hydrated, done, finished, router]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const go = useCallback((to: Step) => {
    setHistory((h) => [...h, step]);
    setStep(to);
  }, [step]);
  const next = useCallback(() => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) go(STEPS[i + 1]);
  }, [step, go]);
  const back = () => {
    setHistory((h) => {
      const copy = [...h];
      let prev = copy.pop();
      if (prev === "generation") prev = copy.pop(); // never replay the build screen
      if (prev) setStep(prev);
      return copy;
    });
  };
  const onGenerated = useCallback(() => setStep("photos"), []);

  const saveProduct = (p: ProductInfo) => {
    setProduct(p);
    setAnswers({ product: { name: p.name, category: p.category, description: p.description, sample: p.sample } });
  };

  const finish = (plan: string) => {
    setFinished(true);
    setPlan((plan === "free" ? "starter" : plan) as PlanId);
    let target = "/campaigns";
    if (projectId) {
      const c = createCampaign({
        name: `Campagne · ${product.name}`,
        projectId,
        objective: OBJECTIVE[answers.goal ?? "auto"] ?? "sales",
        audience: product.category,
        platforms: answers.platforms.length ? answers.platforms : ["instagram", "tiktok"],
        formats: ["product-photos", "ugc", "video-ads", "stories", "carousels"],
      });
      target = `/campaigns/${c.id}`;
    }
    complete();
    router.push(target);
  };

  if (!hydrated) return <div className="min-h-dvh bg-bg" />;

  const qIndex = QUESTION_STEPS.indexOf(step);
  const canGoBack = history.length > 0 && step !== "generation" && step !== "analysis";

  const screen = (() => {
    switch (step) {
      case "opening": return <OpeningScreen onStart={next} onLogin={() => { complete(); router.push("/home"); }} />;
      case "upload": return <UploadScreen onPick={(p) => { saveProduct(p); go("analysis"); }} />;
      case "analysis": return <AnalysisScreen product={product} onChange={saveProduct} onConfirm={next} />;
      case "goal": return <GoalScreen value={answers.goal} onChange={(v) => setAnswers({ goal: v })} onNext={next} />;
      case "platforms": return <PlatformsScreen value={answers.platforms} onChange={(v) => setAnswers({ platforms: v })} onNext={next} />;
      case "style": return <StyleScreen product={product} value={answers.style ?? null} onChange={(v) => setAnswers({ style: v })} onNext={next} />;
      case "brand": return <BrandScreen value={!!answers.brandKit} onChange={(v) => setAnswers({ brandKit: v })} onNext={next} />;
      case "boldness": return <BoldnessScreen value={answers.boldness ?? null} onChange={(v) => setAnswers({ boldness: v })} onNext={next} />;
      case "generation": return <GenerationScreen product={product} onDone={onGenerated} />;
      case "photos": return <PhotosScreen product={product} onNext={next} />;
      case "ugc": return <UgcScreen product={product} onNext={next} />;
      case "ads": return <AdsScreen product={product} onNext={next} />;
      case "copy": return <CopyScreen product={product} onNext={next} />;
      case "campaign": return <FullCampaignScreen product={product} onNext={next} />;
      case "formats": return <FormatsScreen product={product} onNext={next} />;
      case "value": return <ValueScreen product={product} onNext={next} />;
      case "workflow": return <WorkflowScreen onNext={next} />;
      case "card": return <CampaignCardScreen product={product} platformsCount={answers.platforms.length} onNext={next} />;
      case "calendar": return <CalendarScreen product={product} onNext={next} />;
      case "paywall": return <PaywallScreen product={product} onFinish={finish} />;
    }
  })();

  return (
    <div className="min-h-dvh bg-bg flex flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full bg-accent2/20 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between h-14 md:h-16 px-4 md:px-8">
        <div className="w-10">
          {canGoBack && (
            <button type="button" onClick={back} aria-label="Retour" className="size-9 rounded-full flex items-center justify-center text-text2 hover:text-text hover:bg-white/5">
              <ArrowLeft className="size-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="size-7 rounded-md bg-gradient-to-br from-highlight via-accent to-green flex items-center justify-center shadow-glow">
            <Sparkles className="size-4 text-on-accent" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Sokozia</span>
        </div>
        <div className="w-10 flex justify-end">
          {qIndex >= 0 && <StepDots total={QUESTION_STEPS.length} current={qIndex} className="hidden sm:flex" />}
        </div>
      </header>
      {qIndex >= 0 && <StepDots total={QUESTION_STEPS.length} current={qIndex} className="sm:hidden justify-center relative z-10" />}

      <main className="relative flex-1 flex flex-col items-center justify-center px-5 py-6 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="w-full flex justify-center"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: reduce ? 0.1 : 0.25 }}
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
