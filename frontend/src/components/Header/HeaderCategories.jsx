import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";
import ServicesDropdown from "./ServicesDropdown";
import GiftingCategoriesMegaMenu from "./GiftingCategoriesMegaMenu";
import BrandedGiftingDropdown from "./BrandedGiftingDropdown";
import FestiveGiftsDropdown from "./FestiveGiftsDropdown";
import ContactUsDropdown from "./ContactUsDropdown";

const HeaderCategories = ({ onOpenBulkModal, onOpenCatalogueModal }) => {
  const { navigation } = useSiteContent();
  const [activeMenu, setActiveMenu] = useState(null);
  const timeoutRef = useRef(null);
  const hoverOpenedAt = useRef(0);

  const handleMouseEnter = (menuName) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(menuName);
    hoverOpenedAt.current = Date.now();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const closeMenu = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(null);
  };

  const toggleMenu = (menuName) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // A click right after hover-open should not immediately close the menu again.
    const justHovered = Date.now() - hoverOpenedAt.current < 600;
    setActiveMenu((current) => (current === menuName && !justHovered ? null : menuName));
  };

  // Keyboard and touch users: Escape closes, and moving focus out of the nav closes.
  const handleNavKeyDown = (e) => {
    if (e.key === "Escape" && activeMenu) {
      closeMenu();
      e.currentTarget.querySelector("[aria-expanded=\"true\"]")?.focus();
    }
  };

  const handleNavBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      closeMenu();
    }
  };

  const navItems = (navigation?.items || [])
    .filter((item) => item.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const downloadAction = navigation?.actions?.downloadCatalogues;
  const bulkAction = navigation?.actions?.bulkEnquiry;

  return (
    <nav
      className="header-nav luxury-gifting-nav"
      aria-label="Main"
      onKeyDown={handleNavKeyDown}
      onBlur={handleNavBlur}
    >
      <ul className="flex-header flex-categories gifting-nav-list">
        {navItems.map((item) => {
          // 1. Home
          if (item.key === "home") {
            return (
              <li key={item.id} className="nav-item">
                <Link to={item.path || "/"} className="nav-link-item" onClick={closeMenu}>
                  {item.label || "Home"}
                </Link>
              </li>
            );
          }

          // 2. About Us
          if (item.key === "about") {
            return (
              <li key={item.id} className="nav-item">
                <Link to="/about" className="nav-link-item" onClick={closeMenu}>
                  {item.label || "About Us"}
                </Link>
              </li>
            );
          }

          // 3. Services Dropdown
          if (item.key === "services") {
            return (
              <li
                key={item.id}
                className={`nav-item dropdown-parent ${activeMenu === "services" ? "is-active" : ""}`}
                onMouseEnter={() => handleMouseEnter("services")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-link-item nav-dropdown-btn"
                  aria-expanded={activeMenu === "services"}
                  onClick={() => toggleMenu("services")}
                  aria-haspopup="true"
                >
                  <span>{item.label || "Services"}</span>
                  <i className="fa-solid fa-chevron-down nav-chevron-icon"></i>
                </button>
                <ServicesDropdown
                  isOpen={activeMenu === "services"}
                  onClose={closeMenu}
                  onOpenBulkModal={onOpenBulkModal}
                />
              </li>
            );
          }

          // 4. Gifting Categories Mega Menu
          if (item.key === "categories") {
            return (
              <li
                key={item.id}
                className={`nav-item dropdown-parent mega-parent ${activeMenu === "categories" ? "is-active" : ""}`}
                onMouseEnter={() => handleMouseEnter("categories")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-link-item nav-dropdown-btn highlight-mega-trigger"
                  aria-expanded={activeMenu === "categories"}
                  onClick={() => toggleMenu("categories")}
                  aria-haspopup="true"
                >
                  <span className="category-gift-icon">
                    <i className={item.icon || "fa-solid fa-gift"}></i>
                  </span>
                  <span>{item.label || "Gifting Categories"}</span>
                  <i className="fa-solid fa-chevron-down nav-chevron-icon"></i>
                </button>
                <GiftingCategoriesMegaMenu
                  isOpen={activeMenu === "categories"}
                  onClose={closeMenu}
                  onOpenBulkModal={onOpenBulkModal}
                />
              </li>
            );
          }

          // 5. Branded Gifting Dropdown
          if (item.key === "branded") {
            return (
              <li
                key={item.id}
                className={`nav-item dropdown-parent ${activeMenu === "branded" ? "is-active" : ""}`}
                onMouseEnter={() => handleMouseEnter("branded")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-link-item nav-dropdown-btn"
                  aria-expanded={activeMenu === "branded"}
                  onClick={() => toggleMenu("branded")}
                  aria-haspopup="true"
                >
                  <span>{item.label || "Branded Gifting"}</span>
                  <i className="fa-solid fa-chevron-down nav-chevron-icon"></i>
                </button>
                <BrandedGiftingDropdown
                  isOpen={activeMenu === "branded"}
                  onClose={closeMenu}
                />
              </li>
            );
          }

          // 6. Festive Gifts Dropdown
          if (item.key === "festive") {
            return (
              <li
                key={item.id}
                className={`nav-item dropdown-parent ${activeMenu === "festive" ? "is-active" : ""}`}
                onMouseEnter={() => handleMouseEnter("festive")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-link-item nav-dropdown-btn festive-nav-trigger"
                  aria-expanded={activeMenu === "festive"}
                  onClick={() => toggleMenu("festive")}
                  aria-haspopup="true"
                >
                  {item.badge && /w/.test(item.badge) && (
                    <span className="festive-sparkle-dot">{item.badge}</span>
                  )}
                  <span>{item.label || "Festive Gifts"}</span>
                  <i className="fa-solid fa-chevron-down nav-chevron-icon"></i>
                </button>
                <FestiveGiftsDropdown
                  isOpen={activeMenu === "festive"}
                  onClose={closeMenu}
                  onOpenBulkModal={onOpenBulkModal}
                />
              </li>
            );
          }

          // 7. Contact Us Dropdown
          if (item.key === "contact") {
            return (
              <li
                key={item.id}
                className={`nav-item dropdown-parent ${activeMenu === "contact" ? "is-active" : ""}`}
                onMouseEnter={() => handleMouseEnter("contact")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="nav-link-item nav-dropdown-btn"
                  aria-expanded={activeMenu === "contact"}
                  onClick={() => toggleMenu("contact")}
                  aria-haspopup="true"
                >
                  <span>{item.label || "Contact Us"}</span>
                  <i className="fa-solid fa-chevron-down nav-chevron-icon"></i>
                </button>
                <ContactUsDropdown
                  isOpen={activeMenu === "contact"}
                  onClose={closeMenu}
                  onOpenBulkModal={onOpenBulkModal}
                />
              </li>
            );
          }

          // Custom Link or Custom Item
          return (
            <li key={item.id} className="nav-item">
              <Link to={item.path || "/"} className="nav-link-item" onClick={closeMenu}>
                {item.icon && <i className={`${item.icon}`} style={{ marginRight: "6px" }}></i>}
                <span>{item.label}</span>
                {item.badge && <span className="nav-custom-badge">{item.badge}</span>}
              </Link>
            </li>
          );
        })}

        {/* 8. Download Catalogues Button */}
        {/* 8. Download Catalogues Button */}
        {downloadAction?.enabled !== false && (
          <li className="nav-item nav-item-action">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onOpenCatalogueModal) onOpenCatalogueModal();
              }}
              className="nav-action-btn btn-catalogues"
              title={downloadAction?.label || "Download Catalogues"}
            >
              <i className={downloadAction?.icon || "fa-solid fa-file-arrow-down"}></i>
              <span className="btn-label-desktop">{downloadAction?.label || "Download Catalogues"}</span>
              <span className="btn-label-compact">Catalogues</span>
            </button>
          </li>
        )}

        {/* 9. Enquiry for Bulk Orders (Login/Signup) CTA */}
        {bulkAction?.enabled !== false && (
          <li className="nav-item nav-item-action">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                if (onOpenBulkModal) onOpenBulkModal();
              }}
              className="nav-action-btn btn-bulk-nav-cta"
              title={bulkAction?.label || "Enquiry for Bulk Orders"}
            >
              <i className={bulkAction?.icon || "fa-solid fa-paper-plane"}></i>
              <span className="btn-label-desktop">{bulkAction?.label || "Enquiry for Bulk Orders"}</span>
              <span className="btn-label-compact">Bulk Enquiry</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default HeaderCategories;
