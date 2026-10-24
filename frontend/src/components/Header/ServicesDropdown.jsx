import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const ServicesDropdown = ({ isOpen, onClose, onOpenBulkModal }) => {
  const { services } = useSiteContent();

  return (
    <div
      className={`mega-menu-dropdown services-dropdown ${isOpen ? "is-visible" : ""}`}
      role="region"
      aria-label="Services Dropdown Menu"
    >
      <div className="services-dropdown-inner">
        <div className="services-dropdown-header">
          <div className="services-header-title">
            <span className="services-header-badge">
              <i className="fa-solid fa-handshake"></i> Bespoke Services
            </span>
            <h3>Tailored Gifting Solutions for Every Occasion</h3>
          </div>
          <p className="services-header-desc">
            End-to-end corporate gifting, custom onboarding hampers, event swags, and return gifts with dedicated account management and Pan-India fulfillment.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-card-top">
                <div className="service-card-icon">
                  <i className={service.icon}></i>
                </div>
                {service.tag && <span className="service-tag">{service.tag}</span>}
              </div>

              <h4 className="service-card-title">{service.title}</h4>
              <span className="service-card-subtitle">{service.subtitle}</span>
              <p className="service-card-desc">{service.description}</p>

              <div className="service-card-footer">
                <Link
                  to={service.link}
                  onClick={onClose}
                  className="service-link-explore"
                >
                  Explore Catalog
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenBulkModal) onOpenBulkModal(service.title);
                  }}
                  className="service-btn-enquire"
                >
                  Enquire <i className="fa-regular fa-paper-plane"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="services-dropdown-footer">
          <div className="services-footer-item">
            <i className="fa-solid fa-shield-check"></i>
            <span>Official GST 18% Tax Billing</span>
          </div>
          <div className="services-footer-item">
            <i className="fa-solid fa-truck-fast"></i>
            <span>Pan-India Doorstep Logistics</span>
          </div>
          <div className="services-footer-item">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Free Digital Sample Mockups</span>
          </div>
          <div className="services-footer-item">
            <i className="fa-solid fa-headset"></i>
            <span>Dedicated B2B Account Manager</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesDropdown;
