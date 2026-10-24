import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const BrandedGiftingShowcase = () => {
  const { brands } = useSiteContent();

  return (
    <section className="branded-showcase-section" aria-label="Authorized Brand Partners">
      <div className="container">
        <div className="section-header-editorial">
          <h2 className="section-title-editorial title">{brands.length}+ Leading Brands for Corporate Gifting</h2>
          <p className="section-subtitle-editorial">
            Direct institutional pricing on India’s most trusted lifestyle, luggage, drinkware, and tech brands.
          </p>
        </div>

        <div className="home-brands-grid">
          {brands.map((b) => (
            <Link
              key={b.id || b.name}
              to={`/products?search=${encodeURIComponent(b.name)}`}
              className="home-brand-pill-card"
            >
              <div className="brand-pill-avatar">
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="brand-pill-info">
                <span className="brand-pill-name">{b.name}</span>
                <span className="brand-pill-cat">{b.category}</span>
              </div>
              {b.tag && <span className="brand-pill-tag">{b.tag}</span>}
            </Link>
          ))}
        </div>

        <div className="brand-showcase-trust-bar">
          <div className="trust-bar-item">
            <i className="fa-solid fa-certificate"></i>
            <span>100% Authentic Brand Warranties</span>
          </div>
          <div className="trust-bar-item">
            <i className="fa-solid fa-stamp"></i>
            <span>Co-Branded with Your Company Logo</span>
          </div>
          <div className="trust-bar-item">
            <i className="fa-solid fa-receipt"></i>
            <span>Official GST 18% Tax Billing</span>
          </div>
          <div className="trust-bar-item">
            <i className="fa-solid fa-truck-fast"></i>
            <span>Pan-India Doorstep Logistics</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandedGiftingShowcase;
