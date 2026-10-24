import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { GIFTING_CATEGORIES } from "../../data/navigationData";

const HamburgerMobile = ({
  mobileMenuShow,
  handleMouseClick,
  onOpenBulkModal,
  onOpenCatalogueModal,
}) => {
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const { wishlistCount, openWishlist } = useWishlist();
  const { brands, services, festiveGifts, contactInfo, giftingCategories } = useSiteContent();
  const categories = Array.isArray(giftingCategories) && giftingCategories.length > 0
    ? giftingCategories
    : GIFTING_CATEGORIES;
  const location = useLocation();
  const navigate = useNavigate();

  // Accordion toggle states
  const [openSection, setOpenSection] = useState(null);
  const [openSubcatId, setOpenSubcatId] = useState(null);

  const toggleSection = (sectionName) => {
    setOpenSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const toggleSubcat = (catId) => {
    setOpenSubcatId((prev) => (prev === catId ? null : catId));
  };

  const handleNavClick = () => {
    handleMouseClick();
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    handleMouseClick();
    if (location.pathname === "/") {
      const el = document.getElementById("brand-story");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("brand-story");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  return (
    <>
      <div
        onTouchStart={handleMouseClick}
        onClick={handleMouseClick}
        className={`outside-hamburger-click-close ${mobileMenuShow ? "opened" : ""}`}
      ></div>

      <nav className={`mobile-hamburger-container ${mobileMenuShow ? "opened" : ""}`}>
        {/* Mobile Header Bar */}
        <div className="mobile-menu-header">
          <div className="mobile-menu-brand-wrap">
            <img
              src="/giftingwellness-logo.png"
              alt="Giftingwellness Logo"
              className="mobile-brand-img"
            />
            <div className="mobile-brand-text-col">
              <span className="mobile-menu-brand">Giftingwellness</span>
              <span className="mobile-menu-sub">Corporate Gifting Solutions</span>
            </div>
          </div>
          <button
            onClick={handleMouseClick}
            aria-label="Close menu"
            type="button"
            className="btn-modal-close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* User Account / Sign In Pill */}
        <div className="mobile-auth-banner">
          {user ? (
            <div className="mobile-user-profile">
              <div className="mobile-user-avatar">
                {isAdmin ? (
                  <i className="fa-solid fa-shield-halved"></i>
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
              </div>
              <div className="mobile-user-details">
                <span className="mobile-user-name">{user.name}</span>
                <span className="mobile-user-role">
                  {isAdmin ? "Administrator" : "Corporate Client"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <button
                type="button"
                className="btn-mobile-login"
                onClick={() => {
                  handleMouseClick();
                  openAuthModal("user");
                }}
              >
                <i className="fa-regular fa-user"></i> Login / Signup
              </button>
            </div>
          )}
        </div>

        {/* Quick Action CTAs */}
        <div className="mobile-quick-actions-bar">
          <button
            type="button"
            onClick={() => {
              handleMouseClick();
              if (onOpenBulkModal) onOpenBulkModal();
            }}
            className="btn-mobile-cta btn-mobile-bulk"
            title="Enquiry for Bulk Orders (Login/Signup)"
          >
            <i className="fa-solid fa-boxes-packing"></i>
            <span>Enquiry for Bulk Orders</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleMouseClick();
              if (onOpenCatalogueModal) onOpenCatalogueModal();
            }}
            className="btn-mobile-cta btn-mobile-catalogues"
            title="Download Catalogues"
          >
            <i className="fa-solid fa-file-arrow-down"></i>
            <span>Download Catalogues</span>
          </button>
        </div>

        {/* Navigation Accordion List */}
        <ul className="flex-categories-mobile">
          {/* 1. Home */}
          <li className="mobile-nav-link-row">
            <Link to="/" onClick={handleNavClick}>
              <i className="fa-solid fa-house"></i> Home
            </Link>
          </li>

          {/* 2. About Us */}
          <li className="mobile-nav-link-row">
            <Link to="/about" onClick={handleNavClick}>
              <i className="fa-solid fa-circle-info"></i> About Us
            </Link>
          </li>

          {/* 3. Services Accordion */}
          <li className="mobile-accordion-item">
            <button
              type="button"
              className={`mobile-accordion-trigger ${openSection === "services" ? "open" : ""}`}
              onClick={() => toggleSection("services")}
            >
              <span>
                <i className="fa-solid fa-handshake"></i> Services
              </span>
              <i className={`fa-solid fa-chevron-down ${openSection === "services" ? "rotate" : ""}`}></i>
            </button>
            {openSection === "services" && (
              <ul className="mobile-subnav-list">
                {services.map((srv) => (
                  <li key={srv.id}>
                    <Link to={srv.link} onClick={handleNavClick}>
                      <i className={srv.icon}></i>
                      <div>
                        <strong>{srv.title}</strong>
                        <small>{srv.subtitle}</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* 4. Gifting Categories Accordion (10 Main Categories + Subcategories) */}
          <li className="mobile-accordion-item">
            <button
              type="button"
              className={`mobile-accordion-trigger highlight-mobile-trigger ${openSection === "categories" ? "open" : ""}`}
              onClick={() => toggleSection("categories")}
            >
              <span>
                <i className="fa-solid fa-gift"></i> Gifting Categories ({categories.length})
              </span>
              <i className={`fa-solid fa-chevron-down ${openSection === "categories" ? "rotate" : ""}`}></i>
            </button>
            {openSection === "categories" && (
              <ul className="mobile-subnav-list mobile-cat-list">
                {categories.map((cat, idx) => {
                  const isCatOpen = openSubcatId === cat.id;
                  return (
                    <li key={cat.id} className="mobile-nested-cat-item">
                      <div
                        className="mobile-nested-cat-header"
                        onClick={() => toggleSubcat(cat.id)}
                      >
                        <div className="nested-header-title">
                          <span className="nested-cat-num">{idx + 1}.</span>
                          <i className={cat.icon}></i>
                          <strong>{cat.name}</strong>
                          {cat.badge && <span className="nested-badge">{cat.badge}</span>}
                        </div>
                        <i className={`fa-solid fa-chevron-down ${isCatOpen ? "rotate" : ""}`}></i>
                      </div>

                      {isCatOpen && (
                        <div className="mobile-subcat-chips">
                          {(cat.subcategories || []).map((sub, sIdx) => (
                            <Link
                              key={sIdx}
                              to={`/products?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                              onClick={handleNavClick}
                              className="mobile-chip-link"
                            >
                              <i className={sub.icon || "fa-solid fa-tag"}></i> {sub.name}
                            </Link>
                          ))}
                          <Link
                            to={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={handleNavClick}
                            className="mobile-chip-link-all"
                          >
                            Explore All {cat.name} →
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          {/* 5. Branded Gifting Accordion */}
          <li className="mobile-accordion-item">
            <button
              type="button"
              className={`mobile-accordion-trigger ${openSection === "branded" ? "open" : ""}`}
              onClick={() => toggleSection("branded")}
            >
              <span>
                <i className="fa-solid fa-crown"></i> Branded Gifting ({brands.length})
              </span>
              <i className={`fa-solid fa-chevron-down ${openSection === "branded" ? "rotate" : ""}`}></i>
            </button>
            {openSection === "branded" && (
              <div className="mobile-brands-chips-wrap">
                {brands.map((brand, bIdx) => (
                  <Link
                    key={brand.id || bIdx}
                    to={`/products?search=${encodeURIComponent(brand.name)}`}
                    onClick={handleNavClick}
                    className="mobile-brand-chip"
                  >
                    <span>{brand.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </li>

          {/* 6. Festive Gifts Accordion */}
          <li className="mobile-accordion-item">
            <button
              type="button"
              className={`mobile-accordion-trigger ${openSection === "festive" ? "open" : ""}`}
              onClick={() => toggleSection("festive")}
            >
              <span>
                ✨ Festive Gifts
              </span>
              <i className={`fa-solid fa-chevron-down ${openSection === "festive" ? "rotate" : ""}`}></i>
            </button>
            {openSection === "festive" && (
              <ul className="mobile-subnav-list">
                {festiveGifts.map((festive) => (
                  <li key={festive.id}>
                    <Link to={festive.link} onClick={handleNavClick}>
                      <i className={festive.icon}></i>
                      <div>
                        <strong>{festive.title}</strong>
                        <small>{festive.subtitle}</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* 7. Contact Us Accordion */}
          <li className="mobile-accordion-item">
            <button
              type="button"
              className={`mobile-accordion-trigger ${openSection === "contact" ? "open" : ""}`}
              onClick={() => toggleSection("contact")}
            >
              <span>
                <i className="fa-solid fa-phone"></i> Contact Us
              </span>
              <i className={`fa-solid fa-chevron-down ${openSection === "contact" ? "rotate" : ""}`}></i>
            </button>
            {openSection === "contact" && (
              <div className="mobile-contact-panel">
                <div className="mobile-contact-row">
                  <i className="fa-solid fa-phone-volume"></i>
                  <a href={`tel:${(contactInfo.phonePrimary || "").replace(/\s+/g, "")}`}>
                    {contactInfo.phonePrimary}
                  </a>
                </div>
                <div className="mobile-contact-row">
                  <i className="fa-solid fa-envelope"></i>
                  <a href={`mailto:${contactInfo.emailBulk}`}>
                    {contactInfo.emailBulk}
                  </a>
                </div>
                <div className="mobile-contact-row">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>{contactInfo.addressLine1}, {contactInfo.city}</span>
                </div>
                <a
                  href={`https://wa.me/${(contactInfo.whatsapp || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-whatsapp-btn"
                >
                  <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                </a>
              </div>
            )}
          </li>

          <li className="mobile-nav-divider"></li>

          {/* Saved Items */}
          <li className="mobile-nav-link-row">
            <button
              type="button"
              className="mobile-wishlist-trigger"
              onClick={() => {
                handleMouseClick();
                openWishlist();
              }}
            >
              <span>
                <i className="fa-regular fa-heart"></i> Saved Items
              </span>
              {wishlistCount > 0 && <span className="mobile-badge-count">{wishlistCount}</span>}
            </button>
          </li>

          {/* Cart */}
          <li className="mobile-nav-link-row">
            <Link to="/cart" onClick={handleNavClick} className="mobile-cart-link">
              <span>
                <i className="fa-solid fa-bag-shopping"></i> Shopping Bag
              </span>
            </Link>
          </li>

          {/* Admin link if logged in as admin */}
          {isAdmin && (
            <li className="mobile-nav-link-row">
              {/* Shown only to signed-in admins; /admin works on the live site too. */}
              <Link
                to="/admin"
                onClick={handleNavClick}
                style={{ color: "var(--accent-terracotta, var(--ribbon))", fontWeight: "600" }}
              >
                <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Admin dashboard
              </Link>
            </li>
          )}

          {/* Sign Out if logged in */}
          {user && (
            <li className="mobile-nav-link-row">
              <button
                type="button"
                className="mobile-logout-link"
                onClick={() => {
                  logout();
                  handleMouseClick();
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
};

export default HamburgerMobile;
