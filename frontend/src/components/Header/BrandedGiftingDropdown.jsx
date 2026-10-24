import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const BrandedGiftingDropdown = ({ isOpen, onClose }) => {
  const { brands } = useSiteContent();

  return (
    <div
      className={`mega-menu-dropdown branded-dropdown ${isOpen ? "is-visible" : ""}`}
      role="region"
      aria-label="Branded Gifting Dropdown Menu"
    >
      <div className="branded-dropdown-inner">
        <div className="branded-dropdown-header">
          <div className="branded-header-left">
            <span className="branded-header-tag">
              <i className="fa-solid fa-crown"></i> Authorized Corporate Partner
            </span>
            <h3>Branded Corporate Gifts & Merchandise</h3>
            <p>
              Direct corporate institutional pricing on India’s leading {brands.length}+ premium lifestyle, tech, luggage, and luxury brands with 100% manufacturer warranty.
            </p>
          </div>

          <div className="branded-header-right">
            <Link
              to="/products?search=Branded"
              onClick={onClose}
              className="btn-all-brands"
            >
              <span>View All Brands</span>
             
            </Link>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="brands-showcase-grid">
          {brands.map((brand) => (
            <Link
              key={brand.id || brand.name}
              to={`/products?search=${encodeURIComponent(brand.name)}`}
              onClick={onClose}
              className="brand-card-item"
            >
              <div className="brand-card-avatar">
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="brand-card-info">
                <span className="brand-name">{brand.name}</span>
                <span className="brand-category">{brand.category}</span>
              </div>
              {brand.tag && (
                <span className="brand-tag-badge">{brand.tag}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="branded-footer-strip">
          <span className="brand-trust-item">
            <i className="fa-solid fa-certificate"></i> 100% Authentic Brand Warranties
          </span>
          <span className="brand-trust-item">
            <i className="fa-solid fa-layer-group"></i> Official Institutional Bulk Discounts
          </span>
          <span className="brand-trust-item">
            <i className="fa-solid fa-tag"></i> Co-Branding with Your Company Logo
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrandedGiftingDropdown;
