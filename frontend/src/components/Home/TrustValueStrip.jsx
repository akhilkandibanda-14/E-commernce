import { useSiteContent } from "../../context/SiteContentContext";

const TrustValueStrip = () => {
  const { homePage } = useSiteContent();
  const items = homePage.trustStrip.items || [];
  if (items.length === 0) return null;

  return (
    <section className="trust-strip-section" aria-label="Why companies choose us">
      <div className="container">
        <div className="trust-strip-grid">
          {items.map((b, idx) => (
            <div key={`${b.title}-${idx}`} className="trust-strip-item">
              <div className="trust-strip-icon-wrapper" aria-hidden="true">
                <i className={b.icon || "fa-solid fa-gift"}></i>
              </div>
              <div className="trust-strip-text">
                <h3 className="trust-strip-title">{b.title}</h3>
                <p className="trust-strip-desc">{b.description}</p>
              </div>
              {idx < items.length - 1 && <span className="trust-strip-divider" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustValueStrip;
