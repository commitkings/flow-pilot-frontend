import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
//import { LandingIntegrations } from "@/components/landing/landing-integrations";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#0F0F0F]">
      <LandingNav />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFeatures />
      {/* <LandingIntegrations /> */}
      <LandingFooter />
    </main>
  );
}
