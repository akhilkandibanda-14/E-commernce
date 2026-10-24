import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import ManageGiftingCategories from "./ManageGiftingCategories";
import { ManageServicesDropdown, ManageFestiveDropdown } from "./ManageNavDropdowns";
import ManageHomePage from "./ManageHomePage";
import ImageField from "./ImageField";
import "../../styles/admin/admin-content.css";

const ManageSiteContentContent = () => {
  const {
    brands,
    aboutUs,
    services,
    festiveGifts,
    contactInfo,
    announcement,
    navigation,
    giftingCategories,
    addBrand,
    updateBrand,
    deleteBrand,
    updateNavigation,
    addNavItem,
    updateNavItem,
    deleteNavItem,
    updateAboutUs,
    updateServices,
    updateFestiveGifts,
    updateContactInfo,
    updateAnnouncement,
    resetDefaults,
  } = useSiteContent();

  const [activeTab, setActiveTab] = useState("home"); // Home page editor first; it covers most of the site.
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------- BRAND FORM & MODALS -------------------
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({
    name: "",
    category: "Lifestyle & Gifting",
    tag: "Popular",
    description: "",
    link: "",
  });
  const [brandToDelete, setBrandToDelete] = useState(null);

  // ------------------- NAVIGATION FORM & MODALS -------------------
  const [navForm, setNavForm] = useState(() => JSON.parse(JSON.stringify(navigation || {})));
  const [isNavItemModalOpen, setIsNavItemModalOpen] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState(null);
  const [navItemForm, setNavItemForm] = useState({
    label: "",
    path: "/products",
    icon: "fa-solid fa-link",
    badge: "",
    enabled: true,
  });

  // Keep local nav form in sync if remote navigation changes
  useEffect(() => {
    if (navigation) {
      setNavForm(JSON.parse(JSON.stringify(navigation)));
    }
  }, [navigation]);

  // ------------------- ABOUT US FORM -------------------
  const [aboutForm, setAboutForm] = useState({ ...aboutUs });
  const [newPillar, setNewPillar] = useState({ title: "", description: "", icon: "fa-solid fa-stamp" });

  useEffect(() => {
    if (aboutUs) setAboutForm({ ...aboutUs });
  }, [aboutUs]);

  // ------------------- CONTACT & ANNOUNCEMENT FORMS -------------------
  const [contactForm, setContactForm] = useState({ ...contactInfo });
  const [announcementForm, setAnnouncementForm] = useState({ ...announcement });

  useEffect(() => {
    if (contactInfo) setContactForm({ ...contactInfo });
  }, [contactInfo]);

  useEffect(() => {
    if (announcement) setAnnouncementForm({ ...announcement });
  }, [announcement]);

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ------------------- BRAND ACTIONS -------------------
  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandForm({
      name: "",
      category: "Lifestyle & Gifting",
      tag: "Popular",
      description: "",
      link: "",
    });
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      category: brand.category || "",
      tag: brand.tag || "",
      description: brand.description || "",
      link: brand.link || "",
    });
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    if (!brandForm.name || !brandForm.name.trim()) {
      showToast("Brand name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, brandForm);
        showToast(`Brand "${brandForm.name}" updated successfully!`);
      } else {
        await addBrand(brandForm);
        showToast(`New brand "${brandForm.name}" added to live storefront!`);
      }
      setIsBrandModalOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to save brand", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteBrand = async () => {
    if (!brandToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteBrand(brandToDelete.id);
      showToast(`Brand "${brandToDelete.name}" removed from customer catalog.`);
      setBrandToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------- NAVIGATION BAR ACTIONS -------------------
  const handleSaveWholeNavigation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateNavigation(navForm);
      showToast("Navigation bar saved and published to live storefront!");
    } catch (err) {
      showToast(err.message || "Failed to update navigation bar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNavItem = async (itemId) => {
    const updatedItems = (navForm.items || []).map((it) => {
      if (it.id === itemId || it.key === itemId) {
        return { ...it, enabled: it.enabled === false ? true : false };
      }
      return it;
    });

    const updatedNav = { ...navForm, items: updatedItems };
    setNavForm(updatedNav);

    try {
      await updateNavigation(updatedNav);
      showToast("Navigation item visibility updated!");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleMoveNavItem = async (index, direction) => {
    const items = [...(navForm.items || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // re-assign orders
    const reordered = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    const updatedNav = { ...navForm, items: reordered };
    setNavForm(updatedNav);

    try {
      await updateNavigation(updatedNav);
      showToast("Navigation items reordered!");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleOpenEditNavItem = (item) => {
    setEditingNavItem(item);
    setNavItemForm({
      label: item.label,
      path: item.path || "/products",
      icon: item.icon || "fa-solid fa-link",
      badge: item.badge || "",
      enabled: item.enabled !== false,
    });
    setIsNavItemModalOpen(true);
  };

  const handleOpenAddNavItem = () => {
    setEditingNavItem(null);
    setNavItemForm({
      label: "",
      path: "/products",
      icon: "fa-solid fa-star",
      badge: "NEW",
      enabled: true,
    });
    setIsNavItemModalOpen(true);
  };

  const handleSaveNavItemModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!navItemForm.label.trim()) {
      showToast("Menu label is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingNavItem) {
        await updateNavItem(editingNavItem.id, navItemForm);
        showToast(`Menu option "${navItemForm.label}" updated!`);
      } else {
        await addNavItem(navItemForm);
        showToast(`New menu option "${navItemForm.label}" added to navbar!`);
      }
      setIsNavItemModalOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNavItem = async (itemId, label) => {
    if (!window.confirm(`Are you sure you want to remove "${label}" from the navigation bar?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteNavItem(itemId);
      showToast(`Removed "${label}" from navigation bar.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------- ABOUT US HANDLERS -------------------
  const handleSaveAboutUs = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateAboutUs(aboutForm);
      showToast("About Us details updated! Reflected on Customer Homepage.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPillar = () => {
    if (!newPillar.title.trim()) {
      showToast("Pillar title is required", "error");
      return;
    }
    const updatedPillars = [
      ...(aboutForm.pillars || []),
      {
        id: `pillar-${Date.now()}`,
        ...newPillar,
      },
    ];
    setAboutForm({ ...aboutForm, pillars: updatedPillars });
    setNewPillar({ title: "", description: "", icon: "fa-solid fa-stamp" });
    showToast("Added new core value pillar. Click Save to publish.");
  };

  const handleRemovePillar = (pillarId) => {
    const updatedPillars = (aboutForm.pillars || []).filter((p) => p.id !== pillarId);
    setAboutForm({ ...aboutForm, pillars: updatedPillars });
  };

  // ------------------- CONTACT & ANNOUNCEMENT HANDLERS -------------------
  const handleSaveContact = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateContactInfo(contactForm);
      showToast("Contact details & addresses updated successfully!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateAnnouncement(announcementForm);
      showToast("Top announcement banner updated on all customer pages!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm("Are you sure you want to restore all navigation, brands, and store details to factory defaults?")) {
      setIsSubmitting(true);
      try {
        await resetDefaults();
        showToast("All content and navigation restored to initial factory defaults.");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-content-manager-page">
      <AdminHeader />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className={`admin-toast-banner ${toastMessage.type === "error" ? "error" : "success"}`}>
          <i className={toastMessage.type === "error" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check"}></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="container admin-content-container">
        {/* Page Top Title & Header */}
        <div className="admin-content-header-row">
          <div className="admin-title-col">
            <span className="admin-badge-kicker">
              <i className="fa-solid fa-sliders"></i> Full Store Control
            </span>
            <h1 className="admin-main-heading">Site content</h1>
            <p className="admin-main-subtext">
              Edit what customers see: the home page, navigation, categories, services, festive gifts, brands,
              the brand story and contact details. Changes go live as soon as you save.
            </p>
          </div>

          <div className="admin-top-actions">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="btn-admin-preview"
              title="See changes live on customer storefront"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Live Storefront (Port 5173)
            </a>
            <button
              type="button"
              className="btn-admin-reset"
              onClick={handleResetDefaults}
              title="Reset all content to factory seed defaults"
            >
              <i className="fa-solid fa-rotate-left"></i> Reset Defaults
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-content-tabs-bar">
          <button
            type="button"
            className={`admin-content-tab ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <i className="fa-solid fa-house"></i>
            <span>Home page</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "nav" ? "active" : ""}`}
            onClick={() => setActiveTab("nav")}
          >
            <i className="fa-solid fa-compass"></i>
            <span>Navigation Bar</span>
            <span className="tab-counter-chip">{navForm.items?.length || 7}</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            <i className="fa-solid fa-gift"></i>
            <span>Gift Categories (Mega Menu)</span>
            <span className="tab-counter-chip">{giftingCategories?.length || 10}</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <i className="fa-solid fa-handshake"></i>
            <span>Services Dropdown</span>
            <span className="tab-counter-chip">{services?.length || 4}</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "festive" ? "active" : ""}`}
            onClick={() => setActiveTab("festive")}
          >
            <i className="fa-solid fa-sparkles"></i>
            <span>Festive Gifts</span>
            <span className="tab-counter-chip">{festiveGifts?.length || 3}</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "brands" ? "active" : ""}`}
            onClick={() => setActiveTab("brands")}
          >
            <i className="fa-solid fa-crown"></i>
            <span>Authorized Brands</span>
            <span className="tab-counter-chip">{brands.length}</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <i className="fa-solid fa-circle-info"></i>
            <span>About Us & Story</span>
          </button>

          <button
            type="button"
            className={`admin-content-tab ${activeTab === "contact" ? "active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <i className="fa-solid fa-phone"></i>
            <span>Contact & Banner</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 0: WHOLE NAVIGATION BAR EDITOR */}
        {/* ============================================================== */}
        {activeTab === "home" && (
          <section className="admin-tab-content">
            <ManageHomePage />
          </section>
        )}

        {activeTab === "nav" && (
          <section className="admin-tab-content nav-tab-pane">
            {/* Live Navigation Bar Preview Box */}
            <div className="navbar-live-preview-box">
              <div className="preview-top-label">
                <i className="fa-solid fa-eye"></i> Live Customer Navigation Bar Preview
              </div>
              <div className="navbar-mock-storefront">
                <div className="navbar-mock-brand">
                  <span className="mock-brand-icon">
                    <i className={navForm.brandLogo?.icon || "fa-solid fa-gift"}></i>
                  </span>
                  <div className="mock-brand-text">
                    <strong>{navForm.brandLogo?.text || "ATELIER"}</strong>
                    <small>{navForm.brandLogo?.subtext || "GIFTS & CO."}</small>
                  </div>
                </div>

                <ul className="navbar-mock-items">
                  {(navForm.items || [])
                    .filter((it) => it.enabled !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((it) => (
                      <li key={it.id} className="mock-nav-item">
                        <span>{it.label}</span>
                        {it.type === "dropdown" && <i className="fa-solid fa-chevron-down mock-chevron"></i>}
                        {it.badge && <span className="mock-badge">{it.badge}</span>}
                      </li>
                    ))}
                </ul>

                <div className="navbar-mock-actions">
                  {navForm.actions?.downloadCatalogues?.enabled !== false && (
                    <span className="mock-btn mock-btn-catalog">
                      <i className={navForm.actions?.downloadCatalogues?.icon || "fa-solid fa-file-arrow-down"}></i>
                      {navForm.actions?.downloadCatalogues?.label || "Download Catalogues"}
                    </span>
                  )}
                  {navForm.actions?.bulkEnquiry?.enabled !== false && (
                    <span className="mock-btn mock-btn-bulk">
                      <i className={navForm.actions?.bulkEnquiry?.icon || "fa-solid fa-paper-plane"}></i>
                      {navForm.actions?.bulkEnquiry?.label || "Enquiry for Bulk Orders"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="nav-editor-grid">
              {/* Left Column: Menu Items Reorder & Toggles */}
              <div className="settings-card nav-items-card">
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2><i className="fa-solid fa-list-check"></i> Navigation Menu Items</h2>
                    <p>Toggle visibility, reorder items, rename labels, or add custom menu options.</p>
                  </div>
                  <button type="button" className="btn-add-primary" onClick={handleOpenAddNavItem}>
                    <i className="fa-solid fa-plus"></i> Add Nav Item
                  </button>
                </div>

                <div className="nav-items-table-list">
                  {(navForm.items || [])
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((item, idx) => (
                      <div key={item.id} className={`nav-item-editor-row ${item.enabled === false ? "is-disabled" : ""}`}>
                        <div className="item-order-controls">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveNavItem(idx, "up")}
                            className="btn-order-arrow"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === (navForm.items?.length || 0) - 1}
                            onClick={() => handleMoveNavItem(idx, "down")}
                            className="btn-order-arrow"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>

                        <div className="item-info-col">
                          <div className="item-title-line">
                            <i className={item.icon || "fa-solid fa-link"}></i>
                            <strong className="item-label-text">{item.label}</strong>
                            <span className="item-type-tag">{item.type}</span>
                            {item.badge && <span className="item-badge-pill">{item.badge}</span>}
                          </div>
                          <span className="item-path-subtext">Target: {item.path || "(Opens dropdown menu)"}</span>
                        </div>

                        <div className="item-actions-col">
                          {/* Toggle Switch */}
                          <label className="toggle-switch-wrap" title={item.enabled === false ? "Show in navigation" : "Hide from navigation"}>
                            <input
                              type="checkbox"
                              checked={item.enabled !== false}
                              onChange={() => handleToggleNavItem(item.id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className="toggle-status-label">
                            {item.enabled !== false ? "Visible" : "Hidden"}
                          </span>

                          <button
                            type="button"
                            className="btn-brand-edit"
                            onClick={() => handleOpenEditNavItem(item)}
                            title="Edit label or icon"
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>

                          {item.type === "dropdown" && (
                            <button
                              type="button"
                              className="btn-dropdown-opts"
                              onClick={() => {
                                if (item.key === "categories") setActiveTab("categories");
                                else if (item.key === "services") setActiveTab("services");
                                else if (item.key === "festive") setActiveTab("festive");
                                else if (item.key === "branded") setActiveTab("brands");
                                else if (item.key === "contact") setActiveTab("contact");
                              }}
                              title="Edit all menu options inside this dropdown"
                            >
                              <i className="fa-solid fa-list-check"></i> Edit Options
                            </button>
                          )}

                          {/* Only allow deleting custom nav items */}
                          {item.key?.startsWith("custom-") && (
                            <button
                              type="button"
                              className="btn-brand-delete"
                              onClick={() => handleDeleteNavItem(item.id, item.label)}
                              title="Delete menu item"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Column: Logo & CTA Actions Configuration */}
              <div className="nav-side-settings">
                {/* Brand Logo & Wordmark */}
                <div className="settings-card">
                  <div className="panel-header">
                    <h2><i className="fa-solid fa-signature"></i> Header Brand Logo</h2>
                    <p>Customize the brand text and subtitle displayed on the navigation bar.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Brand Text</label>
                    <input
                      type="text"
                      value={navForm.brandLogo?.text || ""}
                      onChange={(e) =>
                        setNavForm({
                          ...navForm,
                          brandLogo: { ...(navForm.brandLogo || {}), text: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="e.g. ATELIER"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={navForm.brandLogo?.subtext || ""}
                      onChange={(e) =>
                        setNavForm({
                          ...navForm,
                          brandLogo: { ...(navForm.brandLogo || {}), subtext: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="e.g. GIFTS & CO."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Icon Class</label>
                    <input
                      type="text"
                      value={navForm.brandLogo?.icon || ""}
                      onChange={(e) =>
                        setNavForm({
                          ...navForm,
                          brandLogo: { ...(navForm.brandLogo || {}), icon: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="fa-solid fa-gift"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="btn-save-primary"
                    onClick={handleSaveWholeNavigation}
                  >
                    <i className="fa-solid fa-check"></i> Save Logo Settings
                  </button>
                </div>

                {/* Navbar CTA Buttons */}
                <div className="settings-card" style={{ marginTop: "24px" }}>
                  <div className="panel-header">
                    <h2><i className="fa-solid fa-bullhorn"></i> Action CTA Buttons</h2>
                    <p>Customize or toggle the two action buttons on the right side of the navbar.</p>
                  </div>

                  {/* 1. Download Catalogues */}
                  <div className="cta-action-edit-block">
                    <div className="cta-action-header">
                      <strong>Button 1: Download Catalogues</strong>
                      <label className="toggle-switch-wrap">
                        <input
                          type="checkbox"
                          checked={navForm.actions?.downloadCatalogues?.enabled !== false}
                          onChange={(e) =>
                            setNavForm({
                              ...navForm,
                              actions: {
                                ...(navForm.actions || {}),
                                downloadCatalogues: {
                                  ...(navForm.actions?.downloadCatalogues || {}),
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        value={navForm.actions?.downloadCatalogues?.label || ""}
                        onChange={(e) =>
                          setNavForm({
                            ...navForm,
                            actions: {
                              ...(navForm.actions || {}),
                              downloadCatalogues: {
                                ...(navForm.actions?.downloadCatalogues || {}),
                                label: e.target.value,
                              },
                            },
                          })
                        }
                        className="form-input"
                        placeholder="Button label..."
                      />
                    </div>
                  </div>

                  {/* 2. Bulk Enquiry */}
                  <div className="cta-action-edit-block" style={{ marginTop: "16px" }}>
                    <div className="cta-action-header">
                      <strong>Button 2: Bulk Orders CTA</strong>
                      <label className="toggle-switch-wrap">
                        <input
                          type="checkbox"
                          checked={navForm.actions?.bulkEnquiry?.enabled !== false}
                          onChange={(e) =>
                            setNavForm({
                              ...navForm,
                              actions: {
                                ...(navForm.actions || {}),
                                bulkEnquiry: {
                                  ...(navForm.actions?.bulkEnquiry || {}),
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        value={navForm.actions?.bulkEnquiry?.label || ""}
                        onChange={(e) =>
                          setNavForm({
                            ...navForm,
                            actions: {
                              ...(navForm.actions || {}),
                              bulkEnquiry: {
                                ...(navForm.actions?.bulkEnquiry || {}),
                                label: e.target.value,
                              },
                            },
                          })
                        }
                        className="form-input"
                        placeholder="Button label..."
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="btn-save-primary"
                    onClick={handleSaveWholeNavigation}
                    style={{ marginTop: "16px" }}
                  >
                    <i className="fa-solid fa-check"></i> Save Buttons Settings
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: GIFTING CATEGORIES & SUBCATEGORIES (MEGA MENU) */}
        {/* ============================================================== */}
        {activeTab === "categories" && (
          <section className="admin-tab-content">
            <ManageGiftingCategories showToast={showToast} />
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: SERVICES DROPDOWN OPTIONS */}
        {/* ============================================================== */}
        {activeTab === "services" && (
          <section className="admin-tab-content">
            <ManageServicesDropdown showToast={showToast} />
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: FESTIVE GIFTS OPTIONS */}
        {/* ============================================================== */}
        {activeTab === "festive" && (
          <section className="admin-tab-content">
            <ManageFestiveDropdown showToast={showToast} />
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 1: BRANDS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "brands" && (
          <section className="admin-tab-content brands-tab-pane">
            <div className="tab-control-toolbar">
              <div className="toolbar-search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Filter brands by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-field"
                />
                {searchTerm && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchTerm("")}>
                    ✕
                  </button>
                )}
              </div>

              <div className="toolbar-right-actions">
                <span className="brand-count-indicator">
                  Showing <strong>{filteredBrands.length}</strong> of {brands.length} Brands
                </span>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={handleOpenAddBrand}
                >
                  <i className="fa-solid fa-plus"></i> Add New Brand
                </button>
              </div>
            </div>

            {/* Live Storefront Preview Alert */}
            <div className="storefront-sync-notice">
              <i className="fa-solid fa-circle-info notice-icon"></i>
              <div className="notice-text">
                <strong>Real-Time Storefront Integration:</strong> Every brand below automatically appears in the 
                <strong> "Branded Gifting"</strong> top navigation dropdown, mobile drawer, and the homepage Brand Partners grid. Deleting a brand instantly removes it for shoppers.
              </div>
            </div>

            {/* Brands Cards Grid */}
            <div className="admin-brands-grid">
              {filteredBrands.map((brand) => (
                <div key={brand.id} className="admin-brand-card">
                  <div className="brand-card-top">
                    <div className="brand-avatar-badge">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="brand-header-info">
                      <h3 className="brand-card-title">{brand.name}</h3>
                      <span className="brand-card-category">{brand.category || "Lifestyle"}</span>
                    </div>
                    {brand.tag && (
                      <span className="brand-pill-tag-badge">{brand.tag}</span>
                    )}
                  </div>

                  {brand.description && (
                    <p className="brand-card-description">{brand.description}</p>
                  )}

                  <div className="brand-card-footer">
                    <span className="brand-visibility-chip">
                      <i className="fa-solid fa-check"></i> Live in Menu
                    </span>

                    <div className="brand-card-actions">
                      <button
                        type="button"
                        className="btn-brand-edit"
                        onClick={() => handleOpenEditBrand(brand)}
                        title="Edit brand details"
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button
                        type="button"
                        className="btn-brand-delete"
                        onClick={() => setBrandToDelete(brand)}
                        title="Delete brand from store"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBrands.length === 0 && (
                <div className="empty-brands-state">
                  <i className="fa-solid fa-tag empty-icon"></i>
                  <h3>No Brands Found</h3>
                  <p>No brands match your current filter query "{searchTerm}".</p>
                  <button type="button" className="btn-add-primary" onClick={handleOpenAddBrand}>
                    Add New Brand Now
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ABOUT US & BRAND STORY */}
        {/* ============================================================== */}
        {activeTab === "about" && (
          <section className="admin-tab-content about-tab-pane">
            <div className="about-editor-grid">
              {/* Form Side */}
              <form onSubmit={handleSaveAboutUs} className="about-form-panel">
                <div className="panel-header">
                  <h2>Edit "About Us" Content</h2>
                  <p>Customize the company brand story that appears on the Customer Homepage and Header navigation.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Section Kicker / Subtitle Badge
                    <span className="help-text">Small highlighted uppercase badge at top</span>
                  </label>
                  <input
                    type="text"
                    value={aboutForm.kicker || ""}
                    onChange={(e) => setAboutForm({ ...aboutForm, kicker: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Corporate Partnership"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Main Headline Title
                    <span className="help-text">Primary H2 title displayed to customers</span>
                  </label>
                  <input
                    type="text"
                    value={aboutForm.title || ""}
                    onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Gifts That Build Real Connections."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Lead Highlight Statement
                    <span className="help-text">First bold introductory paragraph</span>
                  </label>
                  <textarea
                    rows={3}
                    value={aboutForm.lead || ""}
                    onChange={(e) => setAboutForm({ ...aboutForm, lead: e.target.value })}
                    className="form-textarea"
                    placeholder="Enter bold mission statement..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Detailed Company Narrative
                    <span className="help-text">Supporting story paragraph</span>
                  </label>
                  <textarea
                    rows={4}
                    value={aboutForm.paragraphs?.[0] || ""}
                    onChange={(e) => setAboutForm({ ...aboutForm, paragraphs: [e.target.value] })}
                    className="form-textarea"
                    placeholder="Detailed corporate gifting philosophy..."
                  />
                </div>

                <div className="form-row">
                  <div className="half-col">
                    <ImageField
                      label="Brand story image"
                      value={aboutForm.image || ""}
                      onChange={(url) => setAboutForm({ ...aboutForm, image: url })}
                    />
                  </div>
                  <div className="form-group half-col">
                    <label className="form-label">Image Caption Badge</label>
                    <input
                      type="text"
                      value={aboutForm.captionYear || ""}
                      onChange={(e) => setAboutForm({ ...aboutForm, captionYear: e.target.value })}
                      className="form-input"
                      placeholder="e.g. ATELIER B2B LAB"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image Caption Subtext</label>
                  <input
                    type="text"
                    value={aboutForm.captionDetail || ""}
                    onChange={(e) => setAboutForm({ ...aboutForm, captionDetail: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Custom Gift Packaging & Precision Engraving"
                  />
                </div>

                {/* Pillars Section */}
                <div className="pillars-management-box">
                  <div className="pillars-header">
                    <h3>Core Value Pillars ({aboutForm.pillars?.length || 0})</h3>
                    <span className="pillars-subtitle">Key advantages displayed alongside the story</span>
                  </div>

                  <div className="current-pillars-list">
                    {(aboutForm.pillars || []).map((pillar) => (
                      <div key={pillar.id} className="pillar-item-row">
                        <div className="pillar-icon-box">
                          <i className={pillar.icon || "fa-solid fa-stamp"}></i>
                        </div>
                        <div className="pillar-details">
                          <strong>{pillar.title}</strong>
                          <p>{pillar.description}</p>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-pillar"
                          onClick={() => handleRemovePillar(pillar.id)}
                          title="Remove this pillar"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Pillar Quick Form */}
                  <div className="add-pillar-subform">
                    <h4>Add Value Pillar</h4>
                    <div className="pillar-inputs-row">
                      <input
                        type="text"
                        placeholder="Pillar Title (e.g. GST Tax Billing)"
                        value={newPillar.title}
                        onChange={(e) => setNewPillar({ ...newPillar, title: e.target.value })}
                        className="form-input"
                      />
                      <select
                        value={newPillar.icon}
                        onChange={(e) => setNewPillar({ ...newPillar, icon: e.target.value })}
                        className="form-select icon-select"
                      >
                        <option value="fa-solid fa-stamp">Stamp (Branding)</option>
                        <option value="fa-solid fa-truck-ramp-box">Truck (Fulfillment)</option>
                        <option value="fa-solid fa-receipt">Receipt (GST Billing)</option>
                        <option value="fa-solid fa-award">Award (Quality)</option>
                        <option value="fa-solid fa-shield-halved">Shield (Warranty)</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Brief description of this benefit..."
                      value={newPillar.description}
                      onChange={(e) => setNewPillar({ ...newPillar, description: e.target.value })}
                      className="form-textarea"
                    />
                    <button
                      type="button"
                      className="btn-add-pillar-action"
                      onClick={handleAddPillar}
                    >
                      <i className="fa-solid fa-plus"></i> Add Pillar
                    </button>
                  </div>
                </div>

                <div className="form-submit-row">
                  <button type="submit" disabled={isSubmitting} className="btn-save-primary">
                    <i className="fa-solid fa-cloud-arrow-up"></i> Save & Publish About Us
                  </button>
                </div>
              </form>

              {/* Live Preview Side */}
              <div className="about-live-preview-panel">
                <div className="preview-sticky-wrap">
                  <div className="preview-badge-header">
                    <i className="fa-solid fa-eye"></i> Live Storefront Preview (Homepage)
                  </div>
                  <div className="preview-card-frame">
                    <div className="brand-story-preview">
                      <div className="preview-media-box">
                        <img
                          src={aboutForm.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800"}
                          alt="Brand Story Preview"
                          className="preview-img"
                        />
                        <div className="preview-caption">
                          <span className="caption-year">{aboutForm.captionYear || "ATELIER B2B LAB"}</span>
                          <span className="caption-detail">{aboutForm.captionDetail || "Custom Gift Packaging"}</span>
                        </div>
                      </div>

                      <div className="preview-content-box">
                        <span className="preview-kicker">{aboutForm.kicker || "Corporate Partnership"}</span>
                        <h3 className="preview-title">{aboutForm.title || "Gifts That Build Real Connections."}</h3>
                        <p className="preview-lead">{aboutForm.lead}</p>
                        <p className="preview-body">{aboutForm.paragraphs?.[0]}</p>

                        <div className="preview-pillars-stack">
                          {(aboutForm.pillars || []).map((p) => (
                            <div key={p.id} className="preview-pillar-item">
                              <i className={p.icon}></i>
                              <div>
                                <strong>{p.title}</strong>
                                <p>{p.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CONTACT & BANNER */}
        {/* ============================================================== */}
        {activeTab === "contact" && (
          <section className="admin-tab-content contact-tab-pane">
            <div className="contact-editor-grid">
              {/* Top Banner Settings */}
              <form onSubmit={handleSaveAnnouncement} className="settings-card">
                <div className="panel-header">
                  <h2><i className="fa-solid fa-bullhorn"></i> Top Announcement Banner</h2>
                  <p>Marquee text shown at the very top of every storefront page.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Banner Badge Text</label>
                  <input
                    type="text"
                    value={announcementForm.badge || ""}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, badge: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 🎁 CORPORATE & FESTIVE GIFTING"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Banner Announcement Message</label>
                  <input
                    type="text"
                    value={announcementForm.text || ""}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                    className="form-input"
                    placeholder="Custom logo branding on 10,000+ items..."
                  />
                </div>

                <div className="form-submit-row">
                  <button type="submit" disabled={isSubmitting} className="btn-save-primary">
                    <i className="fa-solid fa-check"></i> Save Banner Text
                  </button>
                </div>
              </form>

              {/* Contact Info Settings */}
              <form onSubmit={handleSaveContact} className="settings-card">
                <div className="panel-header">
                  <h2><i className="fa-solid fa-address-book"></i> Corporate Contact Information</h2>
                  <p>Phone numbers, WhatsApp, emails, and office address shown in Header and Footer.</p>
                </div>

                <div className="form-row">
                  <div className="form-group half-col">
                    <label className="form-label">Primary Phone</label>
                    <input
                      type="text"
                      value={contactForm.phonePrimary || ""}
                      onChange={(e) => setContactForm({ ...contactForm, phonePrimary: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group half-col">
                    <label className="form-label">WhatsApp Contact</label>
                    <input
                      type="text"
                      value={contactForm.whatsapp || ""}
                      onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-col">
                    <label className="form-label">General Support Email</label>
                    <input
                      type="email"
                      value={contactForm.emailGeneral || ""}
                      onChange={(e) => setContactForm({ ...contactForm, emailGeneral: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group half-col">
                    <label className="form-label">Bulk Inquiries Email</label>
                    <input
                      type="email"
                      value={contactForm.emailBulk || ""}
                      onChange={(e) => setContactForm({ ...contactForm, emailBulk: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Office Address Line 1</label>
                  <input
                    type="text"
                    value={contactForm.addressLine1 || ""}
                    onChange={(e) => setContactForm({ ...contactForm, addressLine1: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half-col">
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      value={contactForm.addressLine2 || ""}
                      onChange={(e) => setContactForm({ ...contactForm, addressLine2: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group half-col">
                    <label className="form-label">City & Pincode</label>
                    <input
                      type="text"
                      value={contactForm.city || ""}
                      onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Turnaround & Tax Notice</label>
                  <textarea
                    rows={2}
                    value={contactForm.turnaroundNote || ""}
                    onChange={(e) => setContactForm({ ...contactForm, turnaroundNote: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div className="form-submit-row">
                  <button type="submit" disabled={isSubmitting} className="btn-save-primary">
                    <i className="fa-solid fa-check"></i> Save Contact Details
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================== */}
      {/* BRAND MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isBrandModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsBrandModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingBrand ? `Edit Brand: ${editingBrand.name}` : "Add New Brand Partner"}</h2>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setIsBrandModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">
                  Brand Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. H&M, Zara, Apple, Sony..."
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group half-col">
                  <label className="form-label">Category / Line</label>
                  <input
                    type="text"
                    value={brandForm.category}
                    onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                    placeholder="e.g. Lifestyle & Gifting, Apparel"
                    className="form-input"
                  />
                </div>

                <div className="form-group half-col">
                  <label className="form-label">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    value={brandForm.tag}
                    onChange={(e) => setBrandForm({ ...brandForm, tag: e.target.value })}
                    placeholder="e.g. Popular, Exclusive, Trending"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description (Optional)</label>
                <input
                  type="text"
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="Brief description of brand items..."
                  className="form-input"
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsBrandModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-save-modal"
                >
                  {isSubmitting ? (
                    <span><i className="fa-solid fa-spinner fa-spin"></i> Saving...</span>
                  ) : editingBrand ? (
                    "Save Changes"
                  ) : (
                    "Add Brand to Store"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* NAV ITEM MODAL (ADD / EDIT) */}
      {/* ============================================================== */}
      {isNavItemModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsNavItemModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingNavItem ? `Edit Menu Option: ${editingNavItem.label}` : "Add New Navigation Item"}</h2>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setIsNavItemModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNavItemModal} className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">
                  Navigation Label <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={navItemForm.label}
                  onChange={(e) => setNavItemForm({ ...navItemForm, label: e.target.value })}
                  placeholder="e.g. New Arrivals, Corporate Hampers, Deals..."
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group half-col">
                  <label className="form-label">Target Link / URL</label>
                  <input
                    type="text"
                    value={navItemForm.path}
                    onChange={(e) => setNavItemForm({ ...navItemForm, path: e.target.value })}
                    placeholder="/products?style=party or #brand-story"
                    className="form-input"
                  />
                </div>

                <div className="form-group half-col">
                  <label className="form-label">Badge Tag (e.g. HOT, NEW)</label>
                  <input
                    type="text"
                    value={navItemForm.badge}
                    onChange={(e) => setNavItemForm({ ...navItemForm, badge: e.target.value })}
                    placeholder="e.g. ✨ or HOT or 50% OFF"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">FontAwesome Icon Class</label>
                <input
                  type="text"
                  value={navItemForm.icon}
                  onChange={(e) => setNavItemForm({ ...navItemForm, icon: e.target.value })}
                  placeholder="e.g. fa-solid fa-gift, fa-solid fa-fire, fa-solid fa-tag"
                  className="form-input"
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsNavItemModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-save-modal"
                >
                  {isSubmitting ? "Saving..." : editingNavItem ? "Save Menu Item" : "Add to Navigation Bar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {brandToDelete && (
        <div className="admin-modal-overlay" onClick={() => setBrandToDelete(null)}>
          <div className="admin-modal-dialog delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-circle">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2>Delete Brand "{brandToDelete.name}"?</h2>
            <p>
              This brand will be immediately removed from the customer dropdown navigation, mobile drawer, and homepage brand partners showcase.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setBrandToDelete(null)}
              >
                Keep Brand
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="btn-confirm-delete"
                onClick={confirmDeleteBrand}
              >
                Yes, Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ManageSiteContent = () => {
  return (
    <AdminRoute>
      <ManageSiteContentContent />
    </AdminRoute>
  );
};

export default ManageSiteContent;
