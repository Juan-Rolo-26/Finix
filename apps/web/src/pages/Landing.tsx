import { useEffect } from 'react';
import LandingNav from './landing/LandingNav';
import HeroSection from './landing/HeroSection';
import SocialProofSection from './landing/SocialProofSection';
import CommunitySection from './landing/CommunitySection';
import CommunitiesSection from './landing/CommunitiesSection';
import MarketsSection from './landing/MarketsSection';
import NewsSection from './landing/NewsSection';
import AISection from './landing/AISection';
import CreatorsSection from './landing/CreatorsSection';
import PricingSection from './landing/PricingSection';
import WhyFinixSection from './landing/WhyFinixSection';
import FinalCTASection from './landing/FinalCTASection';
import LandingFooter from './landing/LandingFooter';

export default function Landing() {
    // Update document metadata for the landing page
    useEffect(() => {
        document.title = "Finix — El lugar donde los inversores se encuentran";

        // Check for existing meta description or create one
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', 'Descubrí mercados, conectate con inversores, participá en comunidades y llevá tu experiencia financiera al siguiente nivel con Finix.');

        // Set smooth scrolling for the html element
        document.documentElement.style.scrollBehavior = 'smooth';

        return () => {
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-foreground">
            <LandingNav />

            <main className="flex-grow">
                <HeroSection />
                <SocialProofSection />
                <CommunitySection />
                <CommunitiesSection />
                <MarketsSection />
                <NewsSection />
                <AISection />
                <CreatorsSection />
                <PricingSection />
                <WhyFinixSection />
                <FinalCTASection />
            </main>

            <LandingFooter />
        </div>
    );
}
