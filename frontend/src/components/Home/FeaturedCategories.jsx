import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const FeaturedCategories = () => {
  const { homePage } = useSiteContent();
  const { title, subtitle, items = [] } = homePage.featuredCollections;
  if (items.length === 0) return null;

  return (
    <section className="featured-categories-section" aria-label={title}>
      <div className="container">
        <div className="section-header-editorial">
          <h2 className="section-title-editorial title">{title}</h2>
          {subtitle && <p className="section-subtitle-editorial">{subtitle}</p>}
        </div>

        {/* The first collection is the large anchor tile; the rest sit beside it. */}
        <div className="categories-asymmetric-grid">
          {items.map((col, idx) => (
            <Link
              key={`${col.title}-${idx}`}
              to={col.link || "/products"}
              className={`collection-tile-card ${idx === 0 ? "tile-featured-large" : "tile-supporting"}`}
            >
              <div className="collection-tile-media">
                <img src={col.image} alt="" loading="lazy" className="collection-tile-img" />
              </div>

              <div className="collection-tile-content">
                {col.tag && <span className="collection-tile-tag">{col.tag}</span>}
                <h3 className="collection-tile-title">{col.title}</h3>
                {col.description && <p className="collection-tile-desc">{col.description}</p>}
                <span className="collection-tile-cta">Explore Collection</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
