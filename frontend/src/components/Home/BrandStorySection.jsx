import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const BrandStorySection = () => {
  const { aboutUs } = useSiteContent();

  return (
    <section id="brand-story" className="brand-story-section" aria-label="About Giftingwellness">
      <div className="container brand-story-grid">
        <div className="brand-story-media">
          <div className="brand-story-img-container">
            <img
              src={aboutUs?.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80"}
              alt="Kraft jute tote bag ready for logo printing"
              className="brand-story-img"
              loading="lazy"
            />
            <div className="brand-story-caption">
              <span className="caption-year">{aboutUs?.captionYear || "Since 2019, Hyderabad"}</span>
              <span className="caption-detail">{aboutUs?.captionDetail || "Giftingwellness Corporate Solutions"}</span>
            </div>
          </div>
        </div>

        <div className="brand-story-content">
          <h2 className="brand-story-title title">{aboutUs?.title || "Thoughtfully Chosen. Meaningfully Delivered."}</h2>

          <div className="brand-story-copy">
            {aboutUs?.lead ? (
              <p className="brand-story-lead">{aboutUs.lead}</p>
            ) : (
              <p className="brand-story-lead">
                Founded by Ravi Kinnera in 2019, Giftingwellness is a new-age corporate gifting solutions company based in Hyderabad, India.
              </p>
            )}
            {aboutUs?.paragraphs && aboutUs.paragraphs.length > 0 ? (
              aboutUs.paragraphs.map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))
            ) : (
              <>
                <p>
                  We specialize in creating thoughtful, innovative, and memorable gifting experiences that help businesses strengthen relationships with employees, clients, business partners, and event delegates.
                </p>
                <p>
                  At Giftingwellness, we believe that a gift is more than just a product — it is a gesture of appreciation, a reflection of your brand, and an opportunity to build lasting relationships.
                </p>
              </>
            )}
          </div>

          <div className="brand-story-pillars">
            {(aboutUs?.pillars || [
              {
                id: "creativity",
                icon: "fa-solid fa-gem",
                title: "Creativity & Quality",
                description: "From premium executive gifts to welcome kits and festive hampers tailored to your needs and budget."
              },
              {
                id: "seamless",
                icon: "fa-solid fa-handshake-angle",
                title: "Simple & Seamless",
                description: "Helping organizations celebrate people, strengthen connections, and create moments that matter."
              }
            ]).map((pillar) => (
              <div key={pillar.id} className="pillar-item">
                <div className="pillar-icon">
                  <i className={pillar.icon || "fa-solid fa-gem"}></i>
                </div>
                <div className="pillar-text">
                  <h4>{pillar.title}</h4>
                  <p>{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="brand-story-cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/about" className="btn-luxury brand-story-btn">
              Read About Us
            </Link>
            <Link to={aboutUs?.buttonLink || "/products"} className="btn-luxury btn-outline brand-story-btn">
              {aboutUs?.buttonText || "Explore Corporate Catalog"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStorySection;
