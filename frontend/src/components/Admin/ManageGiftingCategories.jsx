import { useState, useEffect } from "react";
import { useSiteContent } from "../../context/SiteContentContext";

const ManageGiftingCategories = ({ showToast }) => {
  const {
    giftingCategories,
    updateGiftingCategories,
    addGiftingCategory,
    updateGiftingCategory,
    deleteGiftingCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSiteContent();

  const categories = Array.isArray(giftingCategories) && giftingCategories.length > 0
    ? giftingCategories
    : [];

  const [activeCatId, setActiveCatId] = useState(categories[0]?.id || "bags");

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCatId)) {
      setActiveCatId(categories[0].id);
    }
  }, [categories, activeCatId]);

  const activeCategory =
    categories.find((c) => c.id === activeCatId) || categories[0] || null;

  // ------------------- CATEGORY FORM & MODAL -------------------
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catModalForm, setCatModalForm] = useState({
    name: "",
    icon: "fa-solid fa-gift",
    badge: "",
    leadTime: "3–5 Days Turnaround",
    description: "",
    highlightImg: "",
  });

  // Active Category Details Form
  const [activeCatForm, setActiveCatForm] = useState({
    name: "",
    icon: "",
    badge: "",
    leadTime: "",
    description: "",
    highlightImg: "",
  });

  // Promotional Banner Form
  const [promoForm, setPromoForm] = useState({
    title: "",
    text: "",
    buttonText: "Get Bulk Quotation",
  });

  // Keep active category forms in sync when active category changes
  useEffect(() => {
    if (activeCategory) {
      setActiveCatForm({
        name: activeCategory.name || "",
        icon: activeCategory.icon || "fa-solid fa-gift",
        badge: activeCategory.badge || "",
        leadTime: activeCategory.leadTime || "3–5 Days Turnaround",
        description: activeCategory.description || "",
        highlightImg: activeCategory.highlightImg || "",
      });

      setPromoForm({
        title: activeCategory.brandingPromo?.title || `Need Custom Corporate Branding on ${activeCategory.name}?`,
        text: activeCategory.brandingPromo?.text || "We provide Screen Printing, Laser Engraving & Digital UV logo placement with Pan-India dispatch.",
        buttonText: activeCategory.brandingPromo?.buttonText || "Get Bulk Quotation",
      });
    }
  }, [activeCategory]);

  // ------------------- SUBCATEGORY MODAL -------------------
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState(null);
  const [subcatForm, setSubcatForm] = useState({
    name: "",
    query: "",
    icon: "fa-solid fa-tag",
  });

  // Delete confirmations
  const [catToDelete, setCatToDelete] = useState(null);
  const [subcatToDelete, setSubcatToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------- CATEGORY ACTIONS -------------------
  const handleOpenAddCategory = () => {
    setEditingCat(null);
    setCatModalForm({
      name: "",
      icon: "fa-solid fa-gift",
      badge: "New",
      leadTime: "3–5 Days Turnaround",
      description: "Premium curated gift items for corporate packaging.",
      highlightImg: "",
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCat(cat);
    setCatModalForm({
      name: cat.name,
      icon: cat.icon || "fa-solid fa-gift",
      badge: cat.badge || "",
      leadTime: cat.leadTime || "3–5 Days Turnaround",
      description: cat.description || "",
      highlightImg: cat.highlightImg || "",
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCategoryModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    if (!catModalForm.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCat) {
        await updateGiftingCategory(editingCat.id, catModalForm);
        showToast(`Category "${catModalForm.name}" updated successfully!`);
      } else {
        const created = await addGiftingCategory({
          ...catModalForm,
          subcategories: [
            { id: `sub-${Date.now()}-1`, name: "Standard Pack", query: catModalForm.name, icon: "fa-solid fa-tag" }
          ],
        });
        setActiveCatId(created.id);
        showToast(`Category "${catModalForm.name}" added with default subcategories!`);
      }
      setIsCatModalOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveActiveCategoryDetails = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeCategory || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateGiftingCategory(activeCategory.id, activeCatForm);
      showToast(`Category "${activeCatForm.name}" details updated successfully!`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePromoBanner = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeCategory || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateGiftingCategory(activeCategory.id, {
        brandingPromo: promoForm,
      });
      showToast(`Corporate branding promo banner updated for "${activeCategory.name}"!`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveCategory = async (idx, direction) => {
    const newCategories = [...categories];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newCategories.length) return;

    const temp = newCategories[idx];
    newCategories[idx] = newCategories[targetIdx];
    newCategories[targetIdx] = temp;

    try {
      await updateGiftingCategories(newCategories);
      showToast("Category sequence updated successfully!");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteGiftingCategory(catToDelete.id);
      showToast(`Category "${catToDelete.name}" removed from navigation mega menu.`);
      setCatToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------- SUBCATEGORY ACTIONS -------------------
  const handleOpenAddSubcat = () => {
    setEditingSubcat(null);
    setSubcatForm({
      name: "",
      query: activeCategory ? `${activeCategory.name} ` : "",
      icon: "fa-solid fa-tag",
    });
    setIsSubcatModalOpen(true);
  };

  const handleOpenEditSubcat = (sub) => {
    setEditingSubcat(sub);
    setSubcatForm({
      name: sub.name,
      query: sub.query || sub.name,
      icon: sub.icon || "fa-solid fa-tag",
    });
    setIsSubcatModalOpen(true);
  };

  const handleSaveSubcatModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting || !activeCategory) return;
    if (!subcatForm.name.trim()) {
      showToast("Subcategory name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubcat) {
        await updateSubcategory(activeCategory.id, editingSubcat.id || editingSubcat.name, subcatForm);
        showToast(`Subcategory "${subcatForm.name}" updated!`);
      } else {
        await addSubcategory(activeCategory.id, subcatForm);
        showToast(`Subcategory "${subcatForm.name}" added to "${activeCategory.name}"!`);
      }
      setIsSubcatModalOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteSubcat = async () => {
    if (!subcatToDelete || isSubmitting || !activeCategory) return;
    setIsSubmitting(true);
    try {
      await deleteSubcategory(activeCategory.id, subcatToDelete.id || subcatToDelete.name);
      showToast(`Subcategory "${subcatToDelete.name}" removed.`);
      setSubcatToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mega-menu-admin-wrapper">
      {/* Overview Banner */}
      <div className="mega-admin-intro-strip">
        <div className="intro-text-col">
          <h2>
            <i className="fa-solid fa-gift"></i> Gifting Categories & Subcategories Mega Menu Editor
          </h2>
          <p>
            This editor controls the <strong>Mega Menu</strong> that drops down from "Gifting Categories" in the main navigation bar. Select a category on the left to edit its details, manage its subcategories, or update its custom branding banner.
          </p>
        </div>
        <div className="intro-actions-col">
          <button type="button" className="btn-add-primary" onClick={handleOpenAddCategory}>
            <i className="fa-solid fa-plus"></i> Add Main Category
          </button>
        </div>
      </div>

      <div className="mega-admin-dual-layout">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Categories Sidebar (Matches screenshot) */}
        {/* ========================================================= */}
        <div className="mega-admin-sidebar-card">
          <div className="mega-sidebar-header-box">
            <span className="sidebar-pill-title">
              <i className="fa-solid fa-gift"></i> {categories.length} GIFT CATEGORIES
            </span>
            <span className="sidebar-hint-tag">Click to edit options</span>
          </div>

          <div className="mega-admin-cat-items-list">
            {categories.map((cat, idx) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <div
                  key={cat.id || idx}
                  className={`mega-admin-cat-item-row ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setActiveCatId(cat.id)}
                >
                  <div className="cat-item-main-click">
                    <span className="cat-number-badge">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="cat-icon-container">
                      <i className={cat.icon || "fa-solid fa-gift"}></i>
                    </span>
                    <strong className="cat-name-label">{cat.name}</strong>

                    {cat.badge && (
                      <span className={`cat-mini-tag ${cat.badge.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="cat-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveCategory(idx, "up")}
                      className="btn-cat-reorder"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1}
                      onClick={() => handleMoveCategory(idx, "down")}
                      className="btn-cat-reorder"
                      title="Move Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatToDelete(cat)}
                      className="btn-cat-delete"
                      title="Delete Category"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Active Category Editor & Subcategories */}
        {/* ========================================================= */}
        {activeCategory ? (
          <div className="mega-admin-detail-column">
            {/* Card 1: Main Category Profile */}
            <div className="settings-card cat-profile-card">
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="cat-kicker-strip">
                    <span className="kicker-tag">Selected Category</span>
                    {activeCategory.badge && <span className="cat-badge-highlight">{activeCategory.badge}</span>}
                    {activeCategory.leadTime && (
                      <span className="cat-time-highlight">
                        <i className="fa-regular fa-clock"></i> {activeCategory.leadTime}
                      </span>
                    )}
                  </div>
                  <h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                    <i className={activeCategory.icon || "fa-solid fa-gift"} style={{ color: "var(--star)" }}></i>
                    {activeCategory.name}
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-brand-edit"
                  onClick={() => handleOpenEditCategory(activeCategory)}
                >
                  <i className="fa-solid fa-pen"></i> Quick Modal Edit
                </button>
              </div>

              <form onSubmit={handleSaveActiveCategoryDetails} className="cat-profile-form">
                <div className="form-row">
                  <div className="form-group half-col">
                    <label className="form-label">Category Name</label>
                    <input
                      type="text"
                      required
                      value={activeCatForm.name}
                      onChange={(e) => setActiveCatForm({ ...activeCatForm, name: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Bags, Bottles, Tech..."
                    />
                  </div>

                  <div className="form-group half-col">
                    <label className="form-label">Badge Tag (e.g. Popular, Best Seller)</label>
                    <input
                      type="text"
                      value={activeCatForm.badge}
                      onChange={(e) => setActiveCatForm({ ...activeCatForm, badge: e.target.value })}
                      className="form-input"
                      placeholder="POPULAR, TRENDING, BEST SELLER"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-col">
                    <label className="form-label">FontAwesome Icon Class</label>
                    <input
                      type="text"
                      value={activeCatForm.icon}
                      onChange={(e) => setActiveCatForm({ ...activeCatForm, icon: e.target.value })}
                      className="form-input"
                      placeholder="fa-solid fa-briefcase"
                    />
                  </div>

                  <div className="form-group half-col">
                    <label className="form-label">Turnaround / Lead Time</label>
                    <input
                      type="text"
                      value={activeCatForm.leadTime}
                      onChange={(e) => setActiveCatForm({ ...activeCatForm, leadTime: e.target.value })}
                      className="form-input"
                      placeholder="e.g. 3–5 Days Turnaround"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category Description</label>
                  <textarea
                    rows="2"
                    value={activeCatForm.description}
                    onChange={(e) => setActiveCatForm({ ...activeCatForm, description: e.target.value })}
                    className="form-textarea"
                    placeholder="Short description displayed at the top of the panel..."
                  />
                </div>

                <div className="cat-form-submit-row">
                  <button type="submit" disabled={isSubmitting} className="btn-save-primary">
                    <i className="fa-solid fa-check"></i> Save Category Details
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Subcategories Grid (Matches screenshot) */}
            <div className="settings-card subcats-card" style={{ marginTop: "24px" }}>
              <div className="subcat-panel-header">
                <div>
                  <h3 className="subcat-title-heading">
                    <i className="fa-solid fa-layer-group"></i> AVAILABLE SUBCATEGORIES ({(activeCategory.subcategories || []).length})
                  </h3>
                  <p className="subcat-title-subtext">
                    Subcategories listed in the right-hand area of the customer mega menu when hovering on <strong>{activeCategory.name}</strong>.
                  </p>
                </div>
                <button type="button" className="btn-add-primary" onClick={handleOpenAddSubcat}>
                  <i className="fa-solid fa-plus"></i> Add Subcategory
                </button>
              </div>

              {/* Subcategories Grid mirroring user screenshot */}
              <div className="admin-subcat-grid">
                {(activeCategory.subcategories || []).map((sub, sIdx) => (
                  <div key={sub.id || sIdx} className="admin-subcat-card">
                    <div className="subcat-card-left">
                      <div className="subcat-card-icon-box">
                        <i className={sub.icon || "fa-solid fa-tag"}></i>
                      </div>
                      <div className="subcat-card-text">
                        <strong className="subcat-card-title">{sub.name}</strong>
                        <span className="subcat-card-link-preview">
                          Search query: <code>{sub.query || sub.name}</code>
                        </span>
                      </div>
                    </div>

                    <div className="subcat-card-actions">
                      <button
                        type="button"
                        className="btn-subcat-action edit"
                        onClick={() => handleOpenEditSubcat(sub)}
                        title="Edit subcategory"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        className="btn-subcat-action delete"
                        onClick={() => setSubcatToDelete(sub)}
                        title="Delete subcategory"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Custom Corporate Branding Strip for this Category */}
            <div className="settings-card promo-banner-card" style={{ marginTop: "24px" }}>
              <div className="panel-header">
                <h2>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "var(--star)" }}></i> Bottom Corporate Branding Banner
                </h2>
                <p>
                  Customize the promotional call-to-action strip shown at the bottom of the Mega Menu for <strong>{activeCategory.name}</strong>.
                </p>
              </div>

              <form onSubmit={handleSavePromoBanner}>
                <div className="form-group">
                  <label className="form-label">Banner Headline</label>
                  <input
                    type="text"
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                    className="form-input"
                    placeholder={`e.g. Need Custom Corporate Branding on ${activeCategory.name}?`}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Description Text</label>
                    <input
                      type="text"
                      value={promoForm.text}
                      onChange={(e) => setPromoForm({ ...promoForm, text: e.target.value })}
                      className="form-input"
                      placeholder="We provide Screen Printing, Laser Engraving & Digital UV logo placement with Pan-India dispatch."
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CTA Button Label</label>
                    <input
                      type="text"
                      value={promoForm.buttonText}
                      onChange={(e) => setPromoForm({ ...promoForm, buttonText: e.target.value })}
                      className="form-input"
                      placeholder="Get Bulk Quotation"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-save-primary">
                  <i className="fa-solid fa-check"></i> Save Promo Banner
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mega-admin-empty-pane">
            <i className="fa-solid fa-folder-open"></i>
            <p>No category selected. Click a category on the left or add a new one.</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT MAIN CATEGORY */}
      {/* ========================================================= */}
      {isCatModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCatModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingCat ? `Edit Category: ${editingCat.name}` : "Add New Gift Category"}</h2>
              <button type="button" className="modal-close-icon" onClick={() => setIsCatModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">Category Name <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  value={catModalForm.name}
                  onChange={(e) => setCatModalForm({ ...catModalForm, name: e.target.value })}
                  placeholder="e.g. Luxury Hampers, Tech Gifts, Bottles..."
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group half-col">
                  <label className="form-label">FontAwesome Icon Class</label>
                  <input
                    type="text"
                    value={catModalForm.icon}
                    onChange={(e) => setCatModalForm({ ...catModalForm, icon: e.target.value })}
                    placeholder="fa-solid fa-gift"
                    className="form-input"
                  />
                </div>
                <div className="form-group half-col">
                  <label className="form-label">Badge Tag (e.g. Popular, Hot)</label>
                  <input
                    type="text"
                    value={catModalForm.badge}
                    onChange={(e) => setCatModalForm({ ...catModalForm, badge: e.target.value })}
                    placeholder="Popular, Best Seller, New"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Turnaround Time</label>
                <input
                  type="text"
                  value={catModalForm.leadTime}
                  onChange={(e) => setCatModalForm({ ...catModalForm, leadTime: e.target.value })}
                  placeholder="e.g. 3–5 Days Turnaround"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="2"
                  value={catModalForm.description}
                  onChange={(e) => setCatModalForm({ ...catModalForm, description: e.target.value })}
                  placeholder="Brief description for category preview..."
                  className="form-textarea"
                />
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-save-modal">
                  {isSubmitting ? "Saving..." : editingCat ? "Save Category" : "Add to Mega Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SUBCATEGORY */}
      {/* ========================================================= */}
      {isSubcatModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsSubcatModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingSubcat ? `Edit Subcategory: ${editingSubcat.name}` : `Add Subcategory to "${activeCategory?.name}"`}</h2>
              <button type="button" className="modal-close-icon" onClick={() => setIsSubcatModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveSubcatModal} className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">Subcategory Name <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  value={subcatForm.name}
                  onChange={(e) => setSubcatForm({ ...subcatForm, name: e.target.value })}
                  placeholder="e.g. Jute Bag, Stainless Steel, Wireless Charger..."
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Search Query / Keyword</label>
                <input
                  type="text"
                  value={subcatForm.query}
                  onChange={(e) => setSubcatForm({ ...subcatForm, query: e.target.value })}
                  placeholder="e.g. Jute Bag or Backpack"
                  className="form-input"
                />
                <small style={{ color: "var(--muted)", marginTop: "4px", display: "block" }}>
                  When customer clicks this subcategory, the catalog searches for this term.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">FontAwesome Icon Class</label>
                <input
                  type="text"
                  value={subcatForm.icon}
                  onChange={(e) => setSubcatForm({ ...subcatForm, icon: e.target.value })}
                  placeholder="fa-solid fa-leaf, fa-solid fa-shield, fa-solid fa-tag"
                  className="form-input"
                />
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsSubcatModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-save-modal">
                  {isSubmitting ? "Saving..." : editingSubcat ? "Save Subcategory" : "Add Subcategory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CATEGORY CONFIRMATION */}
      {/* ========================================================= */}
      {catToDelete && (
        <div className="admin-modal-overlay" onClick={() => setCatToDelete(null)}>
          <div className="admin-modal-dialog delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-circle">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2>Delete Category "{catToDelete.name}"?</h2>
            <p>
              This will remove this category and all its {catToDelete.subcategories?.length || 0} subcategories from the customer navigation mega menu.
            </p>
            <div className="delete-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setCatToDelete(null)}>Keep Category</button>
              <button type="button" disabled={isSubmitting} className="btn-confirm-delete" onClick={confirmDeleteCategory}>
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE SUBCATEGORY CONFIRMATION */}
      {/* ========================================================= */}
      {subcatToDelete && (
        <div className="admin-modal-overlay" onClick={() => setSubcatToDelete(null)}>
          <div className="admin-modal-dialog delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-circle">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2>Delete Subcategory "{subcatToDelete.name}"?</h2>
            <p>
              This subcategory will be removed from the "{activeCategory?.name}" list in the customer mega menu.
            </p>
            <div className="delete-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setSubcatToDelete(null)}>Keep Subcategory</button>
              <button type="button" disabled={isSubmitting} className="btn-confirm-delete" onClick={confirmDeleteSubcat}>
                Yes, Delete Subcategory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGiftingCategories;
