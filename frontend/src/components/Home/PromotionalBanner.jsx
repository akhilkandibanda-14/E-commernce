import { Link } from "react-router-dom";

const PromotionalBanner = () => {
  return (
    <section className="promotional-campaign-section" aria-label="Festive Gifting Campaign">
      <div className="container">
        <div className="promotional-banner-card">
          <div className="promotional-banner-content">
            <span className="banner-kicker">Diwali & Festive 2026 Collection</span>
            <h2 className="banner-headline">Bespoke Hampers for Valued Clients & Teams.</h2>
            <p className="banner-subtext">
              Early-bird bookings are now open. Enjoy customized packaging, company greeting cards, and guaranteed delivery dates for your festival celebrations.
            </p>
            <div className="banner-cta-group">
              <Link to="/products?search=Festive" className="btn-luxury btn-banner-primary">
                Explore Festive Hampers
              </Link>
              <span className="banner-shipping-hint">
                <i className="fa-solid fa-truck-fast"></i> Complimentary corporate logo branding on orders of 50+ units
              </span>
            </div>
          </div>
          <div className="promotional-banner-media">
            <img
              src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1200&q=85"
              alt="Artisanal Diwali and festive corporate gift hamper"
              className="banner-media-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;
