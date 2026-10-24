import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const FestiveGiftsDropdown = ({ isOpen, onClose, onOpenBulkModal }) => {
  const { festiveGifts } = useSiteContent();

  return (
    <div
      className={`mega-menu-dropdown festive-dropdown ${isOpen ? "is-visible" : ""}`}
      role="region"
      aria-label="Festive Gifts Dropdown Menu"
    >
      <div className="festive-dropdown-inner">
        <div className="festive-header">
          <div className="festive-header-left">
            <span className="festive-sparkle-pill">
              <i className="fa-solid fa-sparkles"></i> Seasonal & Festive Celebrations
            </span>
            <h3>Celebrate Festivals & Corporate Milestones in Style</h3>
            <p>
              Handcrafted festive hampers, gourmet dry fruits, artisanal keepsakes, and personalized tokens of appreciation that delight clients, partners, and teams.
            </p>
          </div>
          <div className="festive-header-right">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenBulkModal) onOpenBulkModal("Festive Gifting");
              }}
              className="btn-festive-custom-hamper"
            >
              <i className="fa-solid fa-gifts"></i> Customize Festive Hamper
            </button>
          </div>
        </div>

        <div className="festive-cards-grid">
          {festiveGifts.map((festive) => (
            <div key={festive.id} className="festive-col-card">
              <div className="festive-card-header">
                <span className="festive-icon-circle">
                  <i className={festive.icon}></i>
                </span>
                <div>
                  <h4 className="festive-card-title">{festive.title}</h4>
                  <span className="festive-card-subtitle">{festive.subtitle}</span>
                </div>
              </div>

              <p className="festive-card-desc">{festive.description}</p>

              <div className="festive-popular-items">
                <span className="festive-items-label">Trending Hampers:</span>
                <ul>
                  {festive.items.map((item, i) => (
                    <li key={i}>
                      <Link
                        to={`/products?search=${encodeURIComponent(item)}`}
                        onClick={onClose}
                        className="festive-item-link"
                      >
                        <i className="fa-solid fa-chevron-right"></i> {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="festive-card-cta">
                <Link
                  to={festive.link}
                  onClick={onClose}
                  className="festive-btn-explore"
                >
                  Explore {festive.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FestiveGiftsDropdown;
