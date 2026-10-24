import { Link } from "react-router-dom";
import { openBulkEnquiry } from "../../utils/events";
import { useSiteContent } from "../../context/SiteContentContext";

const HeroSection = () => {
  const { homePage } = useSiteContent();
  const hero = homePage.hero;

  return (
    <section className="gw-hero" aria-labelledby="gw-hero-title">
      <div className="container gw-hero-grid">
        <div className="gw-hero-copy">
          <h1 id="gw-hero-title" className="gw-hero-title">
            {hero.title}
          </h1>
          {hero.lead && <p className="gw-hero-lead">{hero.lead}</p>}

          <div className="gw-hero-actions">
            {hero.primaryCtaText && (
              <Link to={hero.primaryCtaLink || "/products"} className="btn-luxury btn-primary">
                {hero.primaryCtaText}
              </Link>
            )}
            {hero.secondaryCtaText && (
              <button type="button" className="btn-luxury btn-outline" onClick={() => openBulkEnquiry()}>
                {hero.secondaryCtaText}
              </button>
            )}
          </div>

          {Array.isArray(hero.promises) && hero.promises.length > 0 && (
            <ul className="gw-hero-promises">
              {hero.promises.map((p) => (
                <li key={p}>
                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        <figure className="gw-hero-media">
          <div className="gw-hero-arch">
            <img src={hero.image} alt={hero.imageAlt || ""} width="1100" height="733" />
          </div>
          {(hero.tagTitle || hero.tagText) && (
            <figcaption className="gw-hero-tag">
              {hero.tagTitle && <span className="gw-hero-tag-title">{hero.tagTitle}</span>}
              {hero.tagText && <span className="gw-hero-tag-text">{hero.tagText}</span>}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
};

export default HeroSection;
