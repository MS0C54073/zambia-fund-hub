import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FundingCategories from "@/components/landing/FundingCategories";
import HowItWorks from "@/components/landing/HowItWorks";
import JourneyShowcase from "@/components/landing/JourneyShowcase";
import StatsSection from "@/components/landing/StatsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FundingCategories />
      <HowItWorks />
      <JourneyShowcase />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
