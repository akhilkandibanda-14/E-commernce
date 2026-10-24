import { useState } from "react";
import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";
import { GIFTING_CATEGORIES as FALLBACK_CATEGORIES } from "../../data/navigationData";

const GiftingCategoriesMegaMenu = ({ isOpen, onClose, onOpenBulkModal }) => {
  const { giftingCategories } = useSiteContent();
  const categories = Array.isArray(giftingCategories) && giftingCategories.length > 0
    ? giftingCategories
    : FALLBACK_CATEGORIES;

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || "bags");

  const activeCategory =
    categories.find((cat) => cat.id === activeCategoryId) ||
    categories[0] ||
    FALLBACK_CATEGORIES[0];

  return (
    <div
      className={`mega-menu-dropdown gifting-mega-menu ${isOpen ? "is-visible" : ""}`}
      role="region"
      aria-label="Gifting Categories Mega Menu"
    >
      <div className="mega-menu-inner">
        {/* Left Column: Main Categories List */}
        <div className="mega-main-categories-list" role="tablist" aria-label="Main Categories">
          <div className="mega-sidebar-header">
            <span className="mega-sidebar-tag">
              <i className="fa-solid fa-gift"></i> {categories.length} Gift Categories
            </span>
            <span className="mega-sidebar-hint">Hover to preview</span>
          </div>

          <ul className="mega-cat-nav-items">
            {categories.map((cat, index) => {
              const isActive = cat.id === activeCategory.id;
              return (
                <li key={cat.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    id={`cat-tab-${cat.id}`}
                    aria-selected={isActive}
                    aria-controls={`cat-panel-${cat.id}`}
                    className={`mega-cat-btn ${isActive ? "active" : ""}`}
                    onMouseEnter={() => setActiveCategoryId(cat.id)}
                    onFocus={() => setActiveCategoryId(cat.id)}
                  >
                    <div className="mega-cat-btn-left">
                      <span className="mega-cat-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="mega-cat-icon-box">
                        <i className={cat.icon}></i>
                      </span>
                      <span className="mega-cat-label">{cat.name}</span>
                    </div>

                    <div className="mega-cat-btn-right">
                      {cat.badge && (
                        <span className={`mega-cat-mini-badge ${cat.badge.toLowerCase().replace(/\s+/g, "-")}`}>
                          {cat.badge}
                        </span>
                      )}
                      <i className="fa-solid fa-chevron-right mega-cat-chevron"></i>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column: Dynamic Subcategories Smooth Display */}
        <div
          className="mega-subcategories-panel"
          key={activeCategory.id}
          id={`cat-panel-${activeCategory.id}`}
          role="tabpanel"
          aria-labelledby={`cat-tab-${activeCategory.id}`}
        >
          {/* Header of Active Category */}
          <div className="mega-panel-header">
            <div className="mega-panel-title-group">
              <div className="mega-panel-icon-circle">
                <i className={activeCategory.icon}></i>
              </div>
              <div>
                <div className="mega-panel-badges-row">
                  <span className="mega-panel-category-kicker">Gifting Category</span>
                  {activeCategory.badge && (
                    <span className="mega-panel-pill-badge">{activeCategory.badge}</span>
                  )}
                  {activeCategory.leadTime && (
                    <span className="mega-panel-time-badge">
                      <i className="fa-regular fa-clock"></i> {activeCategory.leadTime}
                    </span>
                  )}
                </div>
                <h3 className="mega-panel-title">{activeCategory.name}</h3>
                <p className="mega-panel-desc">{activeCategory.description}</p>
              </div>
            </div>

            <Link
              to={`/products?category=${encodeURIComponent(activeCategory.name)}`}
              onClick={onClose}
              className="btn-mega-view-all"
            >
              <span>View All {activeCategory.name}</span>
             
            </Link>
          </div>

          {/* Subcategories Label */}
          <div className="mega-subcat-section-title">
            <span>Available Subcategories ({(activeCategory.subcategories || []).length})</span>
            <span className="subcat-hint">Click any subcategory to explore items</span>
          </div>

          {/* Subcategories Grid */}
          <div className="mega-subcat-grid">
            {(activeCategory.subcategories || []).map((sub, idx) => (
              <Link
                key={sub.id || idx}
                to={`/products?category=${encodeURIComponent(activeCategory.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                onClick={onClose}
                className="mega-subcat-card"
              >
                <div className="subcat-card-icon">
                  <i className={sub.icon || "fa-solid fa-tag"}></i>
                </div>
                <div className="subcat-card-content">
                  <span className="subcat-card-title">{sub.name}</span>
                  <span className="subcat-card-action">
                    Browse items <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Promotional / Bulk Action Strip */}
          <div className="mega-panel-bottom-cta">
            <div className="bottom-cta-left">
              <span className="bottom-cta-icon">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </span>
              <div className="bottom-cta-text">
                <strong>{activeCategory.brandingPromo?.title || `Need Custom Corporate Branding on ${activeCategory.name}?`}</strong>
                <p>{activeCategory.brandingPromo?.text || "We provide Screen Printing, Laser Engraving & Digital UV logo placement with Pan-India dispatch."}</p>
              </div>
            </div>

            <div className="bottom-cta-actions">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenBulkModal) onOpenBulkModal(activeCategory.name);
                }}
                className="btn-mega-bulk-quote"
              >
                <i className="fa-solid fa-file-invoice-dollar"></i> {activeCategory.brandingPromo?.buttonText || "Get Bulk Quotation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftingCategoriesMegaMenu;
