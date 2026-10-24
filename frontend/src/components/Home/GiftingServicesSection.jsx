import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const GiftingServicesSection = () => {
  const { services } = useSiteContent();

  return (
    <section className="gifting-services-section" aria-label="Bespoke Gifting Services">
      <div className="container">
        <div className="section-header-editorial">
          <h2 className="section-title-editorial title">Tailored Gifting Services</h2>
          <p className="section-subtitle-editorial">
            Comprehensive gifting management from concept curation and mockup proofs to packaging and doorstep distribution.
          </p>
        </div>

        <div className="home-services-grid">
          {services.map((srv) => (
            <div key={srv.id} className="home-service-card">
              <div className="home-service-header">
                <div className="home-service-icon">
                  <i className={srv.icon}></i>
                </div>
                {srv.tag && <span className="home-service-tag">{srv.tag}</span>}
              </div>

              <h3 className="home-service-title">{srv.title}</h3>
              <span className="home-service-subtitle">{srv.subtitle}</span>
              <p className="home-service-desc">{srv.description}</p>

              <div className="home-service-footer">
                <Link to={srv.link} className="home-service-link">
                  Explore Products
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GiftingServicesSection;
