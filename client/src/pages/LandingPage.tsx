import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { PopularWorkers } from "@/components/home/PopularWorkers";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { MainLayout } from "@/components/layout/MainLayout";

export default function LandingPage() {
  return (
    <MainLayout>
      <HeroSection />
      <CategorySection />
      <PopularWorkers />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </MainLayout>
  );
}
