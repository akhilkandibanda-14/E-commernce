import { useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "../Reviews/StarRating";
import { useWishlist } from "../../../context/WishlistContext";
import { formatINR } from "../../../utils/format";

const CategoryProduct = ({
  id,
  title,
  price,
  originalPrice,
  discountPercent,
  category,
  image,
  img,
  images,
  rating,
  brand,
  colors,
  sizes,
  isNew,
  moq,
}) => {
  const { isInWishlist, toggleWishlist, addToCart } = useWishlist();
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage =
    image ||
    img ||
    (Array.isArray(images) && images[0]) ||
    "/introImageCompressed.jfif";

  const secondaryImage =
    Array.isArray(images) && images.length > 1 ? images[1] : primaryImage;

  const numPrice = Number(price);
  // Only show ratings the catalogue actually has; never invent a score.
  const ratingValue = Number(rating?.rate ?? (typeof rating === "number" ? rating : 0));
  const reviewCount = Number(rating?.count || 0);
  const isWishlisted = isInWishlist(id);
  const productUrl = `/products/${encodeURIComponent(category || "casual")}/${id}`;
  const hasMarkdown = originalPrice && Number(originalPrice) > numPrice;
  const minOrder = Number(moq) > 1 ? Number(moq) : 0;

  // Available sizes or defaults
  const availableSizes =
    Array.isArray(sizes) && sizes.length > 0 ? sizes : ["Standard"];

  const productData = {
    id,
    title,
    price: numPrice,
    originalPrice,
    discountPercent,
    category,
    image: primaryImage,
    rating,
  };

  const handleWishlistClick = () => {
    toggleWishlist(productData);
  };

  const handleQuickAddClick = () => {
    // If product has multiple sizes, open the size selection interface
    if (availableSizes.length > 1) {
      setShowSizePicker(true);
    } else if (addToCart) {
      // Direct add for single size
      addToCart(productData, 1, availableSizes[0] || "Standard");
    }
  };

  const handleSelectSize = (size) => {
    if (addToCart) {
      addToCart(productData, 1, size);
    }
    setShowSizePicker(false);
  };

  return (
    <article
      className="product-card-luxury"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // The size picker stays open until it is dismissed, so a small pointer slip doesn't lose it.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setShowSizePicker(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setShowSizePicker(false);
      }}
    >
      <div className="product-img-container">
        {/* Image link is a duplicate of the title link, so keep it out of the tab order. */}
        <Link to={productUrl} className="product-media-link" tabIndex={-1} aria-hidden="true">
          <img
            src={isHovered && secondaryImage ? secondaryImage : primaryImage}
            alt=""
            loading="lazy"
            className="items-line-img"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/introImageCompressed.jfif";
            }}
          />
        </Link>

        <div className="product-card-badges">
          {isNew && <span className="product-new-badge">New</span>}
          {discountPercent > 0 && (
            <span className="product-discount-badge">{discountPercent}% off</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlistClick}
          className={`product-wishlist-btn ${isWishlisted ? "active" : ""}`}
          aria-label={isWishlisted ? `Remove ${title} from saved items` : `Save ${title}`}
          aria-pressed={isWishlisted}
        >
          <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true"></i>
        </button>

        {showSizePicker ? (
          <div className="product-quick-size-selector" role="group" aria-label={`Choose a size for ${title}`}>
            <div className="size-selector-header">
              <span className="size-selector-title">Choose a size</span>
              <button
                type="button"
                className="size-selector-close"
                onClick={() => setShowSizePicker(false)}
                aria-label="Close size options"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
            <div className="size-selector-buttons">
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className="size-choice-btn"
                  onClick={() => handleSelectSize(sz)}
                  aria-label={`Add size ${sz} to bag`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickAddClick}
            className="product-quick-add-btn"
            aria-label={`Add ${title} to bag`}
          >
            <i className="fa-solid fa-bag-shopping" aria-hidden="true"></i> Add to bag
          </button>
        )}
      </div>

      <div className="product-card-body">
        {brand && <span className="product-card-brand">{brand}</span>}
        <h3 className="category-product-title">
          <Link to={productUrl} className="product-title-link">
            {title}
          </Link>
        </h3>

        {Array.isArray(colors) && colors.length > 0 && (
          <div className="product-color-swatches" aria-label={`${colors.length} colours available`}>
            {colors.slice(0, 4).map((c, i) => {
              const hexVal = typeof c === "string" ? c : c.hex || "#333333";
              const colorName = typeof c === "string" ? c : c.name || `Colour ${i + 1}`;
              return (
                <span
                  key={i}
                  className="color-swatch-dot"
                  style={{ backgroundColor: hexVal }}
                  title={colorName}
                />
              );
            })}
            {colors.length > 4 && (
              <span className="color-swatch-more">+{colors.length - 4}</span>
            )}
          </div>
        )}

        {ratingValue > 0 && (
          <div className="product-card-rating">
            <StarRating rating={ratingValue} />
            {reviewCount > 0 && (
              <span className="product-card-reviews-count">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="product-price-row">
          <span className="category-product-price">{formatINR(numPrice)}</span>
          {hasMarkdown && (
            <span className="product-original-price">
              <span className="sr-only">Was </span>
              {formatINR(originalPrice)}
            </span>
          )}
        </div>
        {minOrder > 0 && <p className="product-card-moq">Min. order {minOrder} pcs</p>}
      </div>
    </article>
  );
};

export default CategoryProduct;
