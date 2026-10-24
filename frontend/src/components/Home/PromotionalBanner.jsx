import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const PromotionalBanner = () => {
  const { homePage } = useSiteContent();
  const banner = homePage.promoBanner;

  return (
    <section className="promotional-campaign-section" aria-label={banner.title}>
      <div className="container">
        <div className="promotional-banner-card">
          <div className="promotional-banner-content">
            {banner.kicker && <span className="banner-kicker">{banner.kicker}</span>}
            <h2 className="banner-headline">{banner.title}</h2>
            {banner.text && <p className="banner-subtext">{banner.text}</p>}
            <div className="banner-cta-group">
              {banner.ctaText && (
                <Link to={banner.ctaLink || "/products"} className="btn-luxury btn-banner-primary">
                  {banner.ctaText}
                </Link>
              )}
              {banner.note && (
                <span className="banner-shipping-hint">
                  <i className="fa-solid fa-truck-fast" aria-hidden="true"></i> {banner.note}
                </span>
              )}
            </div>
          </div>
          {banner.image && (
            <div className="promotional-banner-media">
              <img src={banner.image} alt={banner.imageAlt || ""} className="banner-media-img" loading="lazy" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;
