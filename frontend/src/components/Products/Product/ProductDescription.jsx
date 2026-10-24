import { useState } from "react";
import SizeSelector, { normalizeSize } from "../SizeSelector";
import StarRating from "../../Home/Reviews/StarRating";
import AddToCart from "./AddToCart";
import BulkQuoteModal from "./BulkQuoteModal";
import { formatINR } from "../../../utils/format";

const ProductDescription = ({
  details,
  addToCart,
  sizeWarning,
  handleSizeWarning,
}) => {
  const isCorporateOrDrinkware =
    Boolean(details.sku) ||
    Boolean(details.brand) ||
    details.category === "drinkware" ||
    Boolean(details.tierPricing);

  const defaultSize =
    details.sizes && details.sizes.length === 1
      ? details.sizes[0]
      : !details.sizes || details.sizes.length === 0
      ? "Standard"
      : "";

  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [selectedColor, setSelectedColor] = useState(
    details.colors?.[0]?.name || "Default"
  );
  const [selectedBranding, setSelectedBranding] = useState("uv");
  const [customLogoText, setCustomLogoText] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const handleSizeClick = (size) => {
    setSelectedSize(size);
    handleSizeWarning(false);
  };

  const isSizeActive = (size) => {
    return normalizeSize(selectedSize) === normalizeSize(size) ? "size-active" : "";
  };

  if (Object.keys(details).length === 0) {
    return (
      <div className="product-info-loading">
        <p>Loading product details...</p>
      </div>
    );
  }

  const numPrice = Number(details.price) || 0;
  const originalPrice = details.originalPrice ? Number(details.originalPrice) : null;
  const ratingValue = details.rating?.rate || 4.9;
  const ratingCount = details.rating?.count || 320;

  // Selected branding extra cost
  const brandingExtra =
    selectedBranding === "screen"
      ? 15
      : selectedBranding === "uv"
      ? 30
      : selectedBranding === "laser"
      ? 35
      : 0;

  return (
    <section className="product-info">
      {/* Corporate Meta Header if applicable */}
      {isCorporateOrDrinkware && (
        <div className="corporate-meta-row">
          {details.brand && <span className="brand-pill">{details.brand}</span>}
          {details.sku && <span className="sku-badge">SKU: {details.sku}</span>}
          <span className="sku-badge">Item #{details.id}</span>
          <span className="certified-badge">
            <i className="fa-solid fa-shield-halved"></i> Corporate Gifting Verified
          </span>
        </div>
      )}

      <div className="product-description">
        <h1 className="title--lg">{details.title}</h1>

        <div className="rating-flex-detail">
          <StarRating rating={ratingValue} />
          <span className="text--sm text--gray">
            <strong>{ratingValue}</strong> ({ratingCount} reviews)
          </span>
          <span className="rating-verified-dot">•</span>
          <span className="text--sm text-green text--bold">In Stock & Ready for Dispatch</span>
        </div>

        {/* Pricing Row */}
        <div className="product-price-row-detail">
          <p className="product-price-current">
            {formatINR(numPrice)}
            {details.unitLabel && (
              <span className="price-unit-label"> / {details.unitLabel}</span>
            )}
          </p>
          {originalPrice && originalPrice > numPrice && (
            <span className="product-price-original">
              <span className="sr-only">Was </span>
              {formatINR(originalPrice)}
            </span>
          )}
          {details.discountPercent > 0 && (
            <span className="product-discount-pill">
              -{details.discountPercent}% OFF
            </span>
          )}
        </div>

        {details.priceNote && (
          <p className="product-price-note">
            <i className="fa-solid fa-tags"></i> {details.priceNote}
          </p>
        )}

        {/* Quick Highlights / Specs Strip */}
        {isCorporateOrDrinkware && (
          <div className="quick-specs-strip">
            <div className="spec-strip-item">
              <i className="fa-solid fa-box-open"></i>
              <div>
                <strong>MOQ</strong>
                <span>{details.moq || 100} units</span>
              </div>
            </div>
            <div className="spec-strip-item">
              <i className="fa-solid fa-truck-fast"></i>
              <div>
                <strong>Delivery</strong>
                <span>{details.deliveryDays || "7–10 Days"}</span>
              </div>
            </div>
            <div className="spec-strip-item">
              <i className="fa-solid fa-mug-hot"></i>
              <div>
                <strong>Capacity</strong>
                <span>{details.specs?.Capacity || "380 ml"}</span>
              </div>
            </div>
            <div className="spec-strip-item">
              <i className="fa-solid fa-receipt"></i>
              <div>
                <strong>GST Tax</strong>
                <span>18% B2B Credit</span>
              </div>
            </div>
          </div>
        )}

        <p className="text--gray product-desc-text">{details.description}</p>
      </div>

      <hr className="product-divider" />

      {/* Select Colors */}
      {details.colors && details.colors.length > 0 && (
        <div className="filter-colors-container">
          <div className="color-header-row">
            <h2 className="text--sm text--gray">Select Color:</h2>
            <strong className="selected-color-name">{selectedColor}</strong>
          </div>
          <div className="color-swatches">
            {details.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                className={`color-swatch-btn ${
                  selectedColor === c.name ? "active-color" : ""
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
                title={c.name}
              >
                {selectedColor === c.name && (
                  <i
                    className="fa-solid fa-check"
                    style={{
                      color: c.hex === "#f8fafc" || c.hex === "#ffffff" ? "#000" : "#fff",
                      fontSize: "12px",
                    }}
                  ></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Branding Options (Screen / Digital UV / Laser) */}
      {details.brandingOptions && details.brandingOptions.length > 0 && (
        <div className="corporate-branding-section">
          <div className="branding-title-row">
            <h2 className="text--sm text--gray">Custom Logo Branding:</h2>
            <span className="branding-hint">Free 3D digital proof before production</span>
          </div>
          <div className="branding-options-grid">
            {details.brandingOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setSelectedBranding(opt.id)}
                className={`branding-option-card ${
                  selectedBranding === opt.id ? "active-branding" : ""
                }`}
              >
                <div className="branding-radio-dot">
                  {selectedBranding === opt.id && <div className="dot-inner" />}
                </div>
                <div className="branding-option-text">
                  <span className="branding-name">{opt.name}</span>
                  <span className="branding-cost">
                    {opt.pricePerUnit === 0
                      ? "Included"
                      : `+₹${opt.pricePerUnit}/piece`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedBranding !== "none" && (
            <div className="branding-custom-input-box">
              <label htmlFor="custom-logo-text" className="branding-input-label">
                <i className="fa-solid fa-pen-nib"></i> Company / Brand Name to Print:
              </label>
              <input
                id="custom-logo-text"
                type="text"
                className="branding-input-field"
                placeholder="e.g. Google India / Tech Summit 2026"
                value={customLogoText}
                onChange={(e) => setCustomLogoText(e.target.value)}
              />
              <span className="branding-input-subtext">
                Our design team will align the artwork and share a mockup after order placement.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tier Pricing Breakdown Table */}
      {details.tierPricing && details.tierPricing.length > 0 && (
        <div className="tier-pricing-container">
          <div className="tier-header-row">
            <h2 className="text--sm text--gray">Wholesale Tier Pricing:</h2>
            <span className="tier-badge">Bulk Savings up to 35%</span>
          </div>
          <div className="tier-pricing-table">
            {details.tierPricing.map((tier, idx) => (
              <div key={idx} className="tier-row">
                <span className="tier-label">{tier.label}</span>
                <span className="tier-price">
                  ₹{(tier.unitPrice + (selectedBranding !== "none" ? brandingExtra : 0)).toFixed(2)}
                  <small> / unit</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Choose Size / Capacity */}
      {details.sizes && details.sizes.length > 1 ? (
        <div className={`filter-sizes ${sizeWarning ? "required" : ""}`}>
          <h2 className="text--sm text--gray">Choose Size</h2>
          <SizeSelector
            handleSizeClick={handleSizeClick}
            isSizeActive={isSizeActive}
            availableSizes={details.sizes}
          />
          {sizeWarning && (
            <span role="alert" className="error-text">
              Please select a size to proceed.
            </span>
          )}
        </div>
      ) : details.sizes && details.sizes.length === 1 ? (
        <div className="filter-sizes-single">
          <h2 className="text--sm text--gray">Capacity / Size:</h2>
          <span className="single-size-pill">{details.sizes[0]}</span>
        </div>
      ) : null}

      <hr className="product-divider" />

      {/* Dual CTAs: Add to Cart (Sample) & Request Bulk Quote */}
      <div className="product-actions-group">
        <AddToCart
          initialQuantity={1}
          item={{
            ...details,
            selectedColor,
            selectedBranding,
            customLogoText,
            effectivePrice: numPrice + (selectedBranding !== "none" ? brandingExtra : 0),
          }}
          addToCart={addToCart}
          size={selectedSize || defaultSize || "Standard"}
          clearSize={() => {}}
          handleSizeWarning={handleSizeWarning}
        />

        {isCorporateOrDrinkware && (
          <button
            type="button"
            className="btn-bulk-quote btn-pill"
            onClick={() => setIsQuoteModalOpen(true)}
          >
            <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: "8px" }}></i>
            Get Instant Bulk Quote
          </button>
        )}
      </div>

      {/* Trust Signals Strip */}
      <div className="corporate-trust-strip">
        <div className="trust-item">
          <i className="fa-solid fa-file-circle-check text-green"></i>
          <span>18% GST B2B Invoice</span>
        </div>
        <div className="trust-item">
          <i className="fa-solid fa-truck-plane text-blue"></i>
          <span>Pan-India & Global Delivery</span>
        </div>
        <div className="trust-item">
          <i className="fa-solid fa-palette text-purple"></i>
          <span>Free Digital Mockup</span>
        </div>
        <div className="trust-item">
          <i className="fa-solid fa-circle-check text-gold"></i>
          <span>Quality Inspected</span>
        </div>
      </div>

      {/* Bulk Quote Modal */}
      <BulkQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        product={details}
        selectedColor={selectedColor}
        selectedBranding={selectedBranding}
      />
    </section>
  );
};

export default ProductDescription;
