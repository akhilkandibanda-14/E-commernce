import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const ShoppingReassurance = () => {
  const { homePage } = useSiteContent();
  const { title, subtitle, items = [] } = homePage.reassurance;

  return (
    <section className="shopping-reassurance-section" aria-label={title}>
      <div className="container">
        <div className="reassurance-header">
          <h2 className="reassurance-title title">{title}</h2>
          {subtitle && <p className="reassurance-subtitle">{subtitle}</p>}
        </div>

        <div className="reassurance-grid">
          {items.map((p, idx) => (
            <div key={`${p.title}-${idx}`} className="reassurance-card">
              <div className="reassurance-card-top">
                <div className="reassurance-icon" aria-hidden="true">
                  <i className={p.icon || "fa-solid fa-gift"}></i>
                </div>
                {p.badge && <span className="reassurance-badge">{p.badge}</span>}
              </div>

              <h3 className="reassurance-card-title">{p.title}</h3>
              <p className="reassurance-card-detail">{p.detail}</p>

              {p.actionText && (
                <Link to={p.link || "/products"} className="reassurance-card-link">
                  {p.actionText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoppingReassurance;
