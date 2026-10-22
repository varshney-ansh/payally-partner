import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { AgentShowcaseTabs } from "@/components/landing/agent-showcase-tabs";
import { EditorialFeatureSwitcher } from "@/components/landing/editorial-feature-switcher";
import { GlobalCommerceSection } from "@/components/landing/global-commerce-section";
import { DeveloperSection } from "@/components/landing/developer-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-white text-black antialiased selection:bg-[#D9F2FF] selection:text-[#003087]">
        <Navbar />
        <main>
          <HeroSection />
          <AgentShowcaseTabs />
          <EditorialFeatureSwitcher />
          <GlobalCommerceSection />
          <DeveloperSection />
        </main>
        <FooterSection />
      </div>
    </SmoothScrollProvider>
  );
}