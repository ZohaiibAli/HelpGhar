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
    <MainLayout>
      <HeroSection />
      {/* <CategorySection /> */}
      <PopularWorkers />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <ChatbotTeaserSection />
    </MainLayout>
  );
}
