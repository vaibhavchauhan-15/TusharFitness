import { LandingNav } from "@/components/landing/landing-nav";
import { HeroScrollVideo } from "@/components/landing/hero-scroll-video";
import { FeaturesSection } from "@/components/landing/features-section";
import { StatsBar } from "@/components/landing/stats-bar";
import { WorkoutSection } from "@/components/landing/workout-section";
import { DietSection } from "@/components/landing/diet-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CoachSection } from "@/components/landing/coach-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingScrollEffects } from "@/components/landing/landing-scroll-effects";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export function LandingPage() {
  return (
    <SmoothScrollProvider>
      <main id="landing-root" className="relative bg-background text-foreground" style={{ overflowX: "clip" }}>
        <LandingScrollEffects />
        <LandingNav />
        <HeroScrollVideo />
        <FeaturesSection />
        <StatsBar />
        <WorkoutSection />
        <DietSection />
        <PricingSection />
        <CoachSection />
        <LandingFooter />
      </main>
    </SmoothScrollProvider>
  );
}

