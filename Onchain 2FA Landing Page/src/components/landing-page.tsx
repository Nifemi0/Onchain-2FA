import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { FeaturesSection } from "./features-section";
import { DeveloperCtaSection } from "./developer-cta-section";
import { Footer } from "./footer";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <HeroSection onGetStarted={onGetStarted} />
      <HowItWorksSection />
      <FeaturesSection />
      <DeveloperCtaSection />
      <Footer />
    </div>
  );
}