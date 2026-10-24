import { getAdminApiUrl } from "../../utils/apiConfig";
import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { GIFTING_CATEGORIES as FALLBACK_CATEGORIES } from "../../data/navigationData";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";

const PRESET_TEMPLATES = [
  {
    name: "Aluminium Water Bottle",
    category: "Bottles",
    subcategory: "Aluminium",
    style: "corporate",
    brand: "Atelier Alpine",
    title: "Atelier Alpine Pure Aluminium Water Bottle 750ml",
    price: 349,
    originalPrice: 599,
    moq: 25,
    deliveryDays: "2–4 Days",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    description: "Ultra-lightweight food-grade pure aluminium single-wall bottle with leak-proof sports screw cap. Specially crafted for laser engraving company logos and premium corporate hydration gifting.",
    features: "100% Pure food-grade aluminium body\nLeakproof sports carabiner cap\nUltra-lightweight 145g design\nPrecision laser engraving ready\nOfficial B2B GST tax invoice",
  },
  {
    name: "Stainless Steel Flask",
    category: "Bottles",
    subcategory: "Stainless Steel",
    style: "corporate",
    brand: "HydroVibe",
    title: "HydroVibe Matte Black Double-Wall Thermos 750ml",
    price: 649,
    originalPrice: 999,
    moq: 20,
    deliveryDays: "3–5 Days",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    description: "Keeps beverages ice-cold for 24 hours or piping hot for 12 hours. Sweat-free powder-coat exterior with ergonomic carrying handle.",
    features: "18/8 Pro-grade stainless steel\nDouble-wall vacuum insulation\n100% Leakproof sports cap\nBPA and Phthalate free",
  },
  {
    name: "Ceramic Coffee Mug",
    category: "Mugs",
    subcategory: "Ceramic Mugs",
    style: "corporate",
    brand: "Urban Gear",
    title: "Urban Gear Arctic Cork-Base Ceramic Tumbler",
    price: 389,
    originalPrice: 699,
    moq: 50,
    deliveryDays: "5–7 Days",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    description: "Vacuum insulated travel mug with splash-resistant lid and natural anti-slip cork base. Engineered for desk comfort and executive corporate gifting.",
    features: "Food grade ceramic body\nSplash-proof slider lid\nAnti-scratch natural cork base\nOfficial B2B GST invoice",
  },
  {
    name: "Jute Tote Bag",
    category: "Bags",
    subcategory: "Jute Bag",
    style: "corporate",
    brand: "EcoCraft",
    title: "EcoCraft Reinforced Natural Jute Corporate Conference Tote",
    price: 189,
    originalPrice: 329,
    moq: 50,
    deliveryDays: "3–5 Days",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    description: "Eco-friendly premium laminated jute bag with reinforced cotton padded handles and expandable gusset. Excellent for delegate gifting.",
    features: "100% Biodegradable natural golden jute\nPadded soft cotton rope handles\nLaminated water-resistant interior\nScreen print and embroidery friendly",
  },
  {
    name: "Heavyweight Hoodie",
    category: "Apparels",
    subcategory: "T-Shirts & Polos",
    style: "casual",
    brand: "Giftingwellness Originals",
    title: "Minimalist Heavyweight French Terry Hoodie",
    price: 1899,
    originalPrice: 2899,
    moq: 1,
    deliveryDays: "3–4 Days",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    description: "Crafted from 400 GSM brushed organic French Terry cotton for supreme warmth, comfort, and structured drape.",
    features: "100% Organic combed cotton\nDouble-layered hood with drawstrings\nPre-shrunk fabric to prevent sizing loss\nKangaroo front pocket",
  },
];

const AddProduct = () => {
  const { token } = useAuth();
  const { giftingCategories } = useSiteContent();

  const activeCategories = useMemo(() => {
    return Array.isArray(giftingCategories) && giftingCategories.length > 0
      ? giftingCategories
      : FALLBACK_CATEGORIES;
  }, [giftingCategories]);

  // Form states
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("Giftingwellness");
  const [sku, setSku] = useState(`PRD-${Math.floor(100000 + Math.random() * 900000)}`);
  const [category, setCategory] = useState("Bottles");
  const [subcategory, setSubcategory] = useState("Aluminium");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [style, setStyle] = useState("corporate");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [moq, setMoq] = useState("25");
  const [deliveryDays, setDeliveryDays] = useState("2–4 Days");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(["Free Size"]);
  const [isNew, setIsNew] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Derive subcategories for active category
  const currentCategoryData = useMemo(() => {
    return (
      activeCategories.find(
        (c) =>
          c.name.toLowerCase() === category.toLowerCase() ||
          c.id.toLowerCase() === category.toLowerCase()
      ) || null
    );
  }, [activeCategories, category]);

  const currentSubcategories = useMemo(() => {
    return currentCategoryData?.subcategories || [];
  }, [currentCategoryData]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const found = activeCategories.find(
      (c) =>
        c.name.toLowerCase() === newCat.toLowerCase() ||
        c.id.toLowerCase() === newCat.toLowerCase()
    );
    if (found && Array.isArray(found.subcategories) && found.subcategories.length > 0) {
      setSubcategory(found.subcategories[0].name);
    } else {
      setSubcategory("");
    }
    setCustomSubcategory("");
  };

  // Reactive sync: whenever active category changes or subcategories update, automatically select the first valid subcategory
  useEffect(() => {
    if (!currentSubcategories || currentSubcategories.length === 0) {
      if (subcategory !== "__custom__" && subcategory !== "") {
        setSubcategory("");
      }
      return;
    }

    const isCurrentSubValid = currentSubcategories.some(
      (s) => s.name.toLowerCase() === subcategory.toLowerCase()
    );

    if (!isCurrentSubValid && subcategory !== "__custom__") {
      setSubcategory(currentSubcategories[0].name);
      setCustomSubcategory("");
    }
  }, [category, currentSubcategories, subcategory]);

  const effectiveSubcategory =
    subcategory === "__custom__" ? customSubcategory.trim() : subcategory.trim();

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageFileSize, setImageFileSize] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdProduct, setCreatedProduct] = useState(null);

  // Image Upload handler
  const handleImageFileChange = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 15MB.`);
      return;
    }

    setUploadError("");
    setUploadingImage(true);
    setImageFileName(file.name);
    setImageFileSize(`${(file.size / 1024).toFixed(0)} KB`);

    // Immediate local preview via DataURL so UI updates with zero delay
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImage(dataUrl);

      try {
        const res = await fetch(getAdminApiUrl("/api/upload"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: dataUrl,
            fileName: file.name,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          setImage(data.url);
        } else {
          console.warn("Server upload warning, retaining local preview:", data.message);
        }
      } catch (err) {
        console.warn("Image upload network error, retaining local preview:", err.message);
      } finally {
        setUploadingImage(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read the selected image file.");
      setUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImage("");
    setImageFileName("");
    setImageFileSize("");
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Apply a preset template
  const applyTemplate = (t) => {
    setTitle(t.title);
    setBrand(t.brand);
    setCategory(t.category);
    setSubcategory(t.subcategory || "");
    setCustomSubcategory("");
    setStyle(t.style);
    setPrice(t.price.toString());
    setOriginalPrice(t.originalPrice.toString());
    setMoq(t.moq.toString());
    setDeliveryDays(t.deliveryDays);
    setImage(t.image);
    setImageFileName("");
    setImageFileSize("");
    setUploadError("");
    setDescription(t.description);
    setFeatures(t.features);
    setSku(`PRD-${Math.floor(100000 + Math.random() * 900000)}`);
    setErrorMsg("");
    setCreatedProduct(null);
  };

  const toggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setCreatedProduct(null);

    if (!title.trim()) {
      setErrorMsg("Please enter a product title.");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setErrorMsg("Please enter a valid positive selling price.");
      return;
    }
    if (!category.trim()) {
      setErrorMsg("Please choose or specify a category.");
      return;
    }

    setSubmitting(true);

    try {
      const finalImage = image.trim() || "/introImageCompressed.jfif";
      const payload = {
        title: title.trim(),
        brand: brand.trim(),
        sku: sku.trim(),
        category: category.trim(),
        subcategory: effectiveSubcategory,
        style: style.trim(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : Number(price),
        moq: Number(moq) || 1,
        deliveryDays,
        image: finalImage,
        img: finalImage,
        images: [finalImage],
        description: description.trim(),
        features: features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        sizes: selectedSizes,
        isNew,
        isBestSeller,
      };

      const res = await fetch(getAdminApiUrl("/api/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create product.");
      }

      setCreatedProduct(data.product);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred while saving the product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setBrand("Giftingwellness");
    setSku(`PRD-${Math.floor(100000 + Math.random() * 900000)}`);
    setCategory("Bottles");
    setSubcategory("Aluminium");
    setCustomSubcategory("");
    setStyle("corporate");
    setPrice("");
    setOriginalPrice("");
    setMoq("25");
    setDeliveryDays("2–4 Days");
    setImage("");
    setImageFileName("");
    setImageFileSize("");
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setDescription("");
    setFeatures("");
    setSelectedSizes(["Free Size"]);
    setIsNew(true);
    setIsBestSeller(false);
    setCreatedProduct(null);
    setErrorMsg("");
  };

  // Compute live discount percentage
  const numPrice = Number(price) || 0;
  const numOrig = Number(originalPrice) || numPrice;
  const discountPct =
    numOrig > numPrice ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Breadcrumb / Top Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-circle-plus"></i> Add New Product to Store
              </h1>
              <p className="admin-page-desc">
                Publish a new item directly to the live catalog. It will immediately be available for shopping and filtering.
              </p>
            </div>
            <Link to="/admin" className="btn-admin-outline">
              ← Return to Catalog Table
            </Link>
          </div>

          {/* Success Banner */}
          {createdProduct && (
            <div className="admin-success-banner" role="status">
              <div className="success-icon-col">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="success-text-col">
                <h3>Product Successfully Published!</h3>
                <p>
                  <strong>{createdProduct.title}</strong> has been added to the store catalog under the <em>{createdProduct.category}</em> category
                  {createdProduct.subcategory ? <> · <strong>{createdProduct.subcategory}</strong> subcategory</> : null}.
                </p>
                <div className="success-action-btns">
                  <Link
                    to={`/products?category=${encodeURIComponent(createdProduct.category)}&subcategory=${encodeURIComponent(createdProduct.subcategory || "")}`}
                    className="btn-success-view"
                    target="_blank"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> View Filtered Subcategory Page →
                  </Link>
                  <button type="button" className="btn-success-another" onClick={handleReset}>
                    <i className="fa-solid fa-plus"></i> Add Another Product
                  </button>
                  <Link to="/admin" className="btn-success-catalog">
                    Manage in Catalog
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="admin-error-banner" role="alert">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Quick Fill Templates */}
          <section className="preset-templates-section">
            <div className="presets-header">
              <span className="presets-label">
                <i className="fa-solid fa-wand-magic-sparkles"></i> 1-Click Starter Presets:
              </span>
              <span className="presets-sub">Select any sample to prefill the form automatically:</span>
            </div>
            <div className="preset-buttons-row">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-btn"
                  onClick={() => applyTemplate(tmpl)}
                >
                  <span className="preset-dot"></span>
                  {tmpl.name}
                </button>
              ))}
            </div>
          </section>

          {/* Main 2-Column Split: Form + Live Preview Card */}
          <div className="admin-split-grid">
            {/* Form Column */}
            <div className="admin-form-col">
              <form onSubmit={handleSubmit} className="admin-product-form">
                
                {/* Section 1: Basic Information */}
                <div className="admin-form-card">
                  <h2 className="admin-card-heading">
                    <i className="fa-solid fa-tag"></i> 1. Basic Product Info & Categorization
                  </h2>

                  <div className="form-group">
                    <label htmlFor="prod-title">Product Title *</label>
                    <input
                      id="prod-title"
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Atelier Alpine Pure Aluminium Water Bottle 750ml"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="prod-brand">Brand / Manufacturer</label>
                      <input
                        id="prod-brand"
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Giftingwellness, Urban Gear, HydroVibe"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prod-sku">Model / SKU Code</label>
                      <input
                        id="prod-sku"
                        type="text"
                        className="admin-input"
                        placeholder="e.g. UGDB65"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label htmlFor="prod-category">
                        Category * <small style={{ fontWeight: 400, color: "var(--muted)" }}>(Mega Menu Section)</small>
                      </label>
                      <select
                        id="prod-category"
                        className="admin-select"
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        required
                      >
                        {activeCategories.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-subcategory">
                        Subcategory * <small style={{ fontWeight: 500, color: "var(--forest)" }}>({currentSubcategories.length} available for {category})</small>
                      </label>
                      <select
                        id="prod-subcategory"
                        className="admin-select"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        required
                      >
                        {currentSubcategories.map((sub) => (
                          <option key={sub.id || sub.name} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter Custom Subcategory...</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-style">Occasion / Dress Style</label>
                      <select
                        id="prod-style"
                        className="admin-select"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        <option value="corporate">Corporate Gifting</option>
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                        <option value="party">Party</option>
                        <option value="gym">Gym & Fitness</option>
                      </select>
                    </div>
                  </div>

                  {subcategory === "__custom__" && (
                    <div className="form-group" style={{ marginTop: "12px", background: "var(--ivory)", padding: "12px 16px", borderRadius: "8px", border: "1px dashed var(--line)" }}>
                      <label htmlFor="custom-subcategory" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <i className="fa-solid fa-pen-nib" style={{ color: "var(--forest)" }}></i> Type Custom Subcategory Name *
                      </label>
                      <input
                        id="custom-subcategory"
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Copper Bottles, Insulated Sipper, Executive Metal, etc."
                        value={customSubcategory}
                        onChange={(e) => setCustomSubcategory(e.target.value)}
                        required={subcategory === "__custom__"}
                      />
                      <small style={{ color: "var(--muted)", marginTop: "4px", display: "block" }}>
                        Customers will be able to filter and find this product under this exact subcategory name.
                      </small>
                    </div>
                  )}
                </div>

                {/* Section 2: Pricing & Inventory */}
                <div className="admin-form-card">
                  <h2 className="admin-card-heading">
                    <i className="fa-solid fa-coins"></i> 2. Pricing & Delivery
                  </h2>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label htmlFor="prod-price">Selling Price (₹) *</label>
                      <input
                        id="prod-price"
                        type="number"
                        min="1"
                        step="1"
                        className="admin-input"
                        placeholder="389"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-orig-price">Original M.R.P. (₹)</label>
                      <input
                        id="prod-orig-price"
                        type="number"
                        min="1"
                        step="1"
                        className="admin-input"
                        placeholder="699"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Discount Calculated</label>
                      <div className="admin-stat-display">
                        {discountPct > 0 ? (
                          <span className="badge-discount-calc">-{discountPct}% OFF</span>
                        ) : (
                          <span className="badge-nodiscount">No Discount</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="prod-moq">Min. Order Qty (MOQ)</label>
                      <input
                        id="prod-moq"
                        type="number"
                        min="1"
                        className="admin-input"
                        placeholder="1 (or 50 for bulk)"
                        value={moq}
                        onChange={(e) => setMoq(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-delivery">Estimated Delivery</label>
                      <input
                        id="prod-delivery"
                        type="text"
                        className="admin-input"
                        placeholder="e.g. 3–5 Days"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Media & Images */}
                <div className="admin-form-card">
                  <div className="card-heading-with-action">
                    <h2 className="admin-card-heading" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                      <i className="fa-solid fa-image"></i> 3. Product Media & Images
                    </h2>
                    {image && (
                      <span className="badge-image-ready">
                        <i className="fa-solid fa-check"></i> Image Attached
                      </span>
                    )}
                  </div>
                  <hr style={{ margin: "14px 0 18px 0", border: "none", borderTop: "1px solid var(--linen)" }} />

                  {/* Hidden file input for file picker dialog */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadError && (
                    <div className="upload-error-alert" role="alert">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {!image ? (
                    /* Dropzone when no image is selected */
                    <div
                      className={`image-upload-dropzone ${isDragging ? "dropzone-dragging" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          fileInputRef.current && fileInputRef.current.click();
                        }
                      }}
                    >
                      <div className="dropzone-icon-circle">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                      </div>
                      <div className="dropzone-text-group">
                        <p className="dropzone-title">
                          <strong>Click to choose image</strong> or drag & drop photo here
                        </p>
                        <p className="dropzone-subtitle">
                          PNG, JPG, WEBP, GIF, SVG (Up to 15MB)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-upload-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current && fileInputRef.current.click();
                        }}
                      >
                        <i className="fa-solid fa-folder-open"></i> Upload Product Image
                      </button>
                    </div>
                  ) : (
                    /* Active Uploaded Image Card */
                    <div className="uploaded-image-preview-card">
                      <div className="preview-img-box">
                        <img
                          src={image}
                          alt="Uploaded product preview"
                          className="preview-img-thumb"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/introImageCompressed.jfif";
                          }}
                        />
                        {uploadingImage && (
                          <div className="preview-img-overlay">
                            <span className="spinner-small"></span>
                            <span>Uploading to server...</span>
                          </div>
                        )}
                      </div>

                      <div className="preview-meta-box">
                        <div className="preview-meta-header">
                          <span className="file-status-tag">
                            <i className="fa-solid fa-circle-check"></i> Image Ready
                          </span>
                          {imageFileSize && <span className="file-size-tag">{imageFileSize}</span>}
                        </div>
                        <p className="preview-filename" title={imageFileName || image}>
                          {imageFileName || (image.startsWith("data:") ? "Direct Image Upload" : image)}
                        </p>
                        <p className="preview-destination-note">
                          <i className="fa-solid fa-store"></i> Displayed immediately on Customer & Admin catalog
                        </p>

                        <div className="preview-actions-row">
                          <button
                            type="button"
                            className="btn-change-image"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            disabled={uploadingImage}
                          >
                            <i className="fa-solid fa-arrow-rotate-right"></i> Choose Different Image
                          </button>
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={handleRemoveImage}
                            disabled={uploadingImage}
                          >
                            <i className="fa-solid fa-trash-can"></i> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual URL Optional Toggle */}
                  <div className="url-toggle-wrapper">
                    <button
                      type="button"
                      className="btn-url-toggle"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      <i className={`fa-solid ${showUrlInput ? "fa-chevron-up" : "fa-link"}`}></i>{" "}
                      {showUrlInput ? "Hide manual image URL option" : "Or enter an image URL manually"}
                    </button>

                    {showUrlInput && (
                      <div className="url-input-reveal">
                        <input
                          id="prod-image-url"
                          type="text"
                          className="admin-input"
                          placeholder="https://images.unsplash.com/... or /uploads/..."
                          value={image}
                          onChange={(e) => {
                            setImage(e.target.value);
                            setImageFileName("");
                            setImageFileSize("");
                          }}
                        />
                        <small className="form-help-text">
                          You can paste an external URL or static path. Recommended: use the upload button above for local computer files.
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Details & Specifications */}
                <div className="admin-form-card">
                  <h2 className="admin-card-heading">
                    <i className="fa-solid fa-align-left"></i> 4. Description & Specifications
                  </h2>

                  <div className="form-group">
                    <label htmlFor="prod-desc">Product Overview / Description</label>
                    <textarea
                      id="prod-desc"
                      className="admin-textarea"
                      rows="3"
                      placeholder="Describe the product materials, aesthetic, and benefits..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-features">Key Highlights (1 feature per line)</label>
                    <textarea
                      id="prod-features"
                      className="admin-textarea"
                      rows="3"
                      placeholder="Keeps coffee/tea warm for 6 hours&#10;Food grade ceramic with natural cork&#10;Splash-resistant lid included"
                      value={features}
                      onChange={(e) => setFeatures(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Sizes */}
                  <div className="form-group">
                    <label>Available Sizes</label>
                    <div className="sizes-checkbox-row">
                      {["XS", "S", "M", "L", "XL", "XXL", "Free Size"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`size-toggle-btn ${selectedSizes.includes(sz) ? "active" : ""}`}
                          onClick={() => toggleSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badges / Toggles */}
                  <div className="form-grid-2">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                      />
                      <span>Mark as "New Arrival"</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                      />
                      <span>Mark as "Best Seller"</span>
                    </label>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="form-actions-row">
                  <button
                    type="submit"
                    className="btn-admin-submit-product"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span>
                        <i className="fa-solid fa-circle-notch fa-spin"></i> Publishing to Catalog...
                      </span>
                    ) : (
                      <span>
                        <i className="fa-solid fa-cloud-arrow-up"></i> Publish Product to Catalog
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-admin-clear"
                    onClick={handleReset}
                    disabled={submitting}
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>

            {/* Live Storefront Preview Column */}
            <div className="admin-preview-col">
              <div className="preview-sticky-card">
                <div className="preview-badge-header">
                  <span className="live-indicator-dot"></span>
                  <strong>LIVE STOREFRONT PREVIEW</strong>
                </div>
                <p className="preview-caption">
                  This is how customers will see this item in the catalog:
                </p>

                {/* Simulated Shop Product Card */}
                <div className="mock-product-card">
                  <div className="mock-img-wrapper">
                    <img
                      src={
                        image ||
                        "/introImageCompressed.jfif"
                      }
                      alt={title || "Product Preview"}
                      className="mock-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/introImageCompressed.jfif";
                      }}
                    />
                    {discountPct > 0 && (
                      <span className="mock-discount-pill">-{discountPct}%</span>
                    )}
                    {isNew && <span className="mock-new-pill">NEW</span>}
                  </div>

                  <div className="mock-details">
                    <div className="mock-meta-row">
                      <span className="mock-brand">{brand || "Giftingwellness"}</span>
                      <span className="mock-category-pill">{category}</span>
                      {effectiveSubcategory && (
                        <span className="mock-subcategory-pill">
                          <i className="fa-solid fa-layer-group"></i> {effectiveSubcategory}
                        </span>
                      )}
                    </div>

                    <h3 className="mock-title">
                      {title || "Product Title Preview"}
                    </h3>

                    <div className="mock-rating">
                      <span className="stars">★★★★★</span>
                      <span className="rate-num">5.0/5</span>
                    </div>

                    <div className="mock-price-row">
                      <span className="mock-current-price">₹{price || "0"}</span>
                      {numOrig > numPrice && (
                        <span className="mock-orig-price">₹{originalPrice}</span>
                      )}
                      {Number(moq) > 1 && (
                        <span className="mock-moq-badge">MOQ: {moq} pcs</span>
                      )}
                    </div>

                    <div className="mock-delivery-row">
                      <i className="fa-solid fa-truck-fast"></i> Delivers in {deliveryDays || "3–5 Days"}
                    </div>

                    <button type="button" className="mock-btn-preview" disabled>
                      <i className="fa-solid fa-cart-shopping"></i> Add to Cart (Customer View)
                    </button>
                  </div>
                </div>

                {/* Admin Quick Tips Card */}
                <div className="admin-tips-card">
                  <h4>
                    <i className="fa-regular fa-lightbulb"></i> Admin Best Practices
                  </h4>
                  <ul>
                    <li>High-contrast product images on clean backgrounds convert 40% better.</li>
                    <li>Setting an Original M.R.P. highlights discounts to drive bulk orders.</li>
                    <li>Items published here immediately update customer search & filters.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminRoute>
  );
};

export default AddProduct;
