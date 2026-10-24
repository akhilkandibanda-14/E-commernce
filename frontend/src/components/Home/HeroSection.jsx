import { Link } from "react-router-dom";
import { openBulkEnquiry } from "../../utils/events";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1100&q=80";

const promises = [
  "Your logo printed or engraved",
  "GST invoice on every order",
  "Delivered across India",
];

const HeroSection = () => {
  return (
    <section className="gw-hero" aria-labelledby="gw-hero-title">
      <div className="container gw-hero-grid">
        <div className="gw-hero-copy">
          <h1 id="gw-hero-title" className="gw-hero-title">
            Gifts your clients and teams will keep.
          </h1>
          <p className="gw-hero-lead">
            Hampers, onboarding kits, drinkware and merchandise from brands people know,
            finished with your logo and delivered from Hyderabad.
          </p>

          <div className="gw-hero-actions">
            <Link to="/products" className="btn-luxury btn-primary">
              Browse the catalogue
            </Link>
            <button type="button" className="btn-luxury btn-outline" onClick={() => openBulkEnquiry()}>
              Request a bulk quote
            </button>
          </div>

          <ul className="gw-hero-promises">
            {promises.map((p) => (
              <li key={p}>
                <i className="fa-solid fa-check" aria-hidden="true"></i>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <figure className="gw-hero-media">
          <div className="gw-hero-arch">
            <img
              src={HERO_IMAGE}
              alt="Stack of wrapped gift boxes tied with ribbon"
              width="1100"
              height="733"
            />
          </div>
          <figcaption className="gw-hero-tag">
            <span className="gw-hero-tag-title">See it before you order</span>
            <span className="gw-hero-tag-text">Free digital sample on bulk orders</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

export default HeroSection;
