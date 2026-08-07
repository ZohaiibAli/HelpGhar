import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { PopularWorkers } from "@/components/home/PopularWorkers";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { ChatbotTeaserSection } from "@/components/home/ChatBot";
import { MainLayout } from "@/components/layout/MainLayout";
import { useHashScroll } from "@/hooks/useHashScroll";

export default function LandingPage() {
  useHashScroll();

  return (
    // Order follows what a visitor needs, not a marketing funnel: search
    // first, then the actual people, then the categories to browse, then the
    // mechanics and the proof. The worker-recruitment pitch comes last,
    // because almost everyone landing here is looking to hire.
    <MainLayout>
      <HeroSection />
      <PopularWorkers />
      <CategorySection />
      <HowItWorks />
      <Testimonials />
      <ChatbotTeaserSection />
      <CTASection />
    </MainLayout>
  );
}
