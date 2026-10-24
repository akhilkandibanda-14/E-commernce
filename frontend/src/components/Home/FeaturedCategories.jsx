import { Link } from "react-router-dom";

const COLLECTIONS = [
  {
    id: "corporate-drinkware",
    title: "Executive Bottles & Mugs",
    description: "Vacuum insulated temperature-retaining flasks, eco bamboo tumblers, and cork-base ceramic mugs tailored for desk and travel.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80",
    link: "/products?search=Mug",
    tag: "High Volume · Laser Engraved",
    isLarge: true,
  },
  {
    id: "bags-luggage",
    title: "Bags & Executive Backpacks",
    description: "Ballistic nylon laptop bags, gym duffles, and sustainable biodegradable jute conference totes.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    link: "/products?search=Bag",
    tag: "Custom Logo Badging",
    isLarge: false,
  },
  {
    id: "tech-gadgets",
    title: "Smart Tech & Gadgets",
    description: "High-speed power banks, Bluetooth speakers, wireless earbuds, and smart wearable fitness trackers.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    link: "/products?search=Speaker",
    tag: "1-Year Brand Warranty",
    isLarge: false,
  },
  {
    id: "festive-hampers",
    title: "Festive & Diwali Hampers",
    description: "Artisanal dry fruit boxes, handcrafted brass diyas, luxury confectionery, and executive New Year planners.",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80",
    link: "/products?search=Hamper",
    tag: "Seasonal Bestseller",
    isLarge: false,
  },
];

const FeaturedCategories = () => {
  return (
    <section className="featured-categories-section" aria-label="Featured Gifting Collections">
      <div className="container">
        <div className="section-header-editorial">
          <h2 className="section-title-editorial title">Curated Gifts for Every Occasion.</h2>
          <p className="section-subtitle-editorial">
            Discover precision-branded executive merchandise, onboarding gift kits, and festive hampers.
          </p>
        </div>

        {/* Asymmetric Editorial Grid: 1 Large Anchor Tile + 3 Supporting Tiles */}
        <div className="categories-asymmetric-grid">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.id}
              to={col.link}
              className={`collection-tile-card ${col.isLarge ? "tile-featured-large" : "tile-supporting"}`}
            >
              <div className="collection-tile-media">
                <img
                  src={col.image}
                  alt={col.title}
                  loading="lazy"
                  className="collection-tile-img"
                />
                <div className="collection-tile-gradient"></div>
              </div>

              <div className="collection-tile-content">
                <span className="collection-tile-tag">{col.tag}</span>
                <h3 className="collection-tile-title">{col.title}</h3>
                <p className="collection-tile-desc">{col.description}</p>
                <span className="collection-tile-cta">
                  Explore Collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
