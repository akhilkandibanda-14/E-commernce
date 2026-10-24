import HeroSection from "./HeroSection";
import TrustValueStrip from "./TrustValueStrip";
import GiftingServicesSection from "./GiftingServicesSection";
import FeaturedCategories from "./FeaturedCategories";
import HomeCategory from "./HomeCategory/HomeCategory";
import BrandedGiftingShowcase from "./BrandedGiftingShowcase";
import BrandStorySection from "./BrandStorySection";
import PromotionalBanner from "./PromotionalBanner";
import ShoppingReassurance from "./ShoppingReassurance";
import CustomerTestimonials from "./CustomerTestimonials";
import NewsletterSection from "./NewsletterSection";
import { useSiteContent } from "../../context/SiteContentContext";

// Every section's text, images and visibility are editable in Admin → Content & CMS → Home page.
const Home = () => {
  const { homePage } = useSiteContent();
  const show = (key) => homePage.sections?.[key] !== false;

  return (
    <main id="main-content" className="home-page luxury-storefront">
      {show("hero") && <HeroSection />}

      {show("trustStrip") && <TrustValueStrip />}

      {show("services") && <GiftingServicesSection />}

      {show("featuredCollections") && <FeaturedCategories />}

      {show("bestSellers") && (
        <section className="home-best-sellers-section" aria-label={homePage.bestSellers.title}>
          <HomeCategory
            title={homePage.bestSellers.title}
            subtitle={homePage.bestSellers.subtitle}
            filterType="bestSeller"
          />
        </section>
      )}

      {show("brands") && <BrandedGiftingShowcase />}

      {show("brandStory") && <BrandStorySection />}

      {show("promoBanner") && <PromotionalBanner />}

      {show("newArrivals") && (
        <section className="home-new-arrivals-section" aria-label={homePage.newArrivals.title}>
          <HomeCategory
            title={homePage.newArrivals.title}
            subtitle={homePage.newArrivals.subtitle}
            filterType="newArrival"
          />
        </section>
      )}

      {show("reassurance") && <ShoppingReassurance />}

      {show("testimonials") && <CustomerTestimonials />}

      {show("newsletter") && <NewsletterSection />}
    </main>
  );
};

export default Home;
