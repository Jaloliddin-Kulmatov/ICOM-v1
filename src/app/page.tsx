import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import UniversitiesSection from "@/components/landing/universities-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import CtaSection from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar transparent />
      <main>
        <HeroSection />
        <FeaturesSection />
        <UniversitiesSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
