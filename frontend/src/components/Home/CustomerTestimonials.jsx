import StarRating from "./Reviews/StarRating";
import { useSiteContent } from "../../context/SiteContentContext";

const CustomerTestimonials = () => {
  const { homePage } = useSiteContent();
  const { title, subtitle, items = [], isSample } = homePage.testimonials;
  if (items.length === 0) return null;

  return (
    <section className="testimonials-editorial-section" aria-labelledby="testimonials-title">
      <div className="container">
        <div className="section-header-editorial">
          <h2 id="testimonials-title" className="section-title-editorial title">{title}</h2>
          {subtitle && <p className="section-subtitle-editorial">{subtitle}</p>}
        </div>

        <div className="testimonials-editorial-grid">
          {items.map((t, idx) => (
            <article key={`${t.name}-${idx}`} className="testimonial-card-editorial">
              <div className="testimonial-rating-row">
                {Number(t.rating) > 0 && <StarRating rating={Number(t.rating)} />}
                {/* Shown until an admin replaces the placeholder copy with real testimonials. */}
                {isSample && <span className="testimonial-sample-tag">Sample</span>}
              </div>

              {t.title && <h3 className="testimonial-headline">{t.title}</h3>}
              <p className="testimonial-body">{t.comment}</p>

              <div className="testimonial-footer">
                <div className="testimonial-author-block">
                  <span className="author-name">{t.name}</span>
                  {(t.role || t.location) && (
                    <span className="author-location">
                      {[t.role, t.location].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                {t.item && (
                  <span className="testimonial-item-tag">
                    <i className="fa-solid fa-gift" style={{ marginRight: "4px", color: "var(--ribbon)" }} aria-hidden="true"></i>
                    {t.item}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerTestimonials;
