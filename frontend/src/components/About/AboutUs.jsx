import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/about.css";
import BulkEnquiryModal from "../Header/BulkEnquiryModal";
import CatalogueDownloadModal from "../Header/CatalogueDownloadModal";

const AboutUs = () => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCatalogueModalOpen, setIsCatalogueModalOpen] = useState(false);

  return (
    <div className="about-page" aria-label="About Gifting Wellness">
      {/* 1. Hero Banner */}
      <section className="about-hero-section">
        <div className="container about-hero-content">
          <div className="about-hero-badge">
            <i className="fa-solid fa-sparkles"></i>
            <span>Est. 2019 • Hyderabad, India</span>
          </div>

          <h1 className="about-hero-title">
            Gifting Wellness
          </h1>

          <p className="about-hero-subtitle">
            “Corporate Gifting Solutions. Thoughtfully Chosen. Meaningfully Delivered.”
          </p>

          <div className="about-hero-actions">
            <button
              type="button"
              className="about-hero-btn-primary"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <i className="fa-solid fa-paper-plane"></i>
              <span>Enquire for Bulk Orders</span>
            </button>
            <Link to="/products" className="about-hero-btn-secondary">
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>Explore Products</span>
            </Link>
            <button
              type="button"
              className="about-hero-btn-secondary"
              onClick={() => setIsCatalogueModalOpen(true)}
            >
              <i className="fa-solid fa-file-arrow-down"></i>
              <span>Download Catalogues</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics & Credentials Strip */}
      <section className="about-stats-strip" aria-label="Company Statistics">
        <div className="container about-stats-grid">
          <div className="about-stat-item">
            <span className="about-stat-number">2019</span>
            <span className="about-stat-label">Founded</span>
            <span className="about-stat-sub">By Ravi Kinnera</span>
          </div>
          <div className="about-stat-item">
            <span className="about-stat-number">Hyderabad</span>
            <span className="about-stat-label">Headquarters</span>
            <span className="about-stat-sub">Telangana, India</span>
          </div>
          <div className="about-stat-item">
            <span className="about-stat-number">10+</span>
            <span className="about-stat-label">Core Categories</span>
            <span className="about-stat-sub">Custom Merch & Hampers</span>
          </div>
          <div className="about-stat-item">
            <span className="about-stat-number">Pan-India</span>
            <span className="about-stat-label">Doorstep Delivery</span>
            <span className="about-stat-sub">Official GST Billing</span>
          </div>
        </div>
      </section>

      {/* 3. Founder Story & Company Background */}
      <section className="about-story-section">
        <div className="container about-story-grid">
          {/* Media & Founder Spotlight */}
          <div className="about-story-media-wrap">
            <div className="about-story-card">
              <img
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80"
                alt="Gifting Wellness bespoke corporate gift packaging studio"
                className="about-story-img"
              />
              <div className="about-founder-badge-card">
                <div className="founder-title-row">
                  <span className="founder-name">Ravi Kinnera</span>
                  <span className="founder-role">Founder • Est. 2019</span>
                </div>
                <p className="founder-quote">
                  “A gift is more than just a product — it is a gesture of appreciation, a reflection of your brand, and an opportunity to build lasting relationships.”
                </p>
              </div>
            </div>
          </div>

          {/* Core Content */}
          <div className="about-story-text">
            <span className="about-kicker">Our Heritage & Mission</span>
            <h2 className="about-story-heading">
              A New-Age Corporate Gifting Solutions Company
            </h2>

            <p className="about-lead-paragraph">
              Founded by Ravi Kinnera in 2019, Gifting Wellness is a new-age corporate gifting solutions company based in Hyderabad, India.
            </p>

            <p className="about-body-paragraph">
              We specialize in creating thoughtful, innovative, and memorable gifting experiences that help businesses strengthen relationships with employees, clients, business partners, and event delegates.
            </p>

            <p className="about-body-paragraph">
              At Gifting Wellness, we understand that every organization has its own identity, values, and culture. Whether it’s employee appreciation, festive celebrations, client engagement, corporate events, conferences, or special business milestones, we deliver gifting solutions that reflect your brand’s personality and make every occasion memorable.
            </p>

            <p className="about-body-paragraph">
              Our team is passionate about discovering and delivering the perfect blend of creativity, quality, and practicality. From premium executive gifts and customized merchandise to employee welcome kits, festive hampers, promotional gifts, and event giveaways, we offer a diverse range of gifting options tailored to your business needs and budget.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Our Mission & Our Vision */}
      <section className="about-mission-vision-section" aria-label="Our Mission and Vision">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="mv-icon-badge">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <span className="mv-kicker">Guiding Purpose</span>
              <h3 className="mv-title">Our Mission</h3>
              <p className="mv-text">
                To deliver innovative, high-quality, and personalized corporate gifting solutions that help businesses express appreciation, strengthen professional relationships, and celebrate success.
              </p>
            </div>

            <div className="vision-card">
              <div className="mv-icon-badge">
                <i className="fa-solid fa-compass"></i>
              </div>
              <span className="mv-kicker">Future Aspiration</span>
              <h3 className="mv-title">Our Vision</h3>
              <p className="mv-text">
                To become a trusted corporate gifting partner for businesses across India by setting new standards in creativity, quality, personalization, and customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Philosophy, Innovation & Principles */}
      <section className="about-philosophy-section" aria-label="Our Philosophy">
        <div className="container">
          <div className="about-section-header">
            <span className="about-kicker">Our Philosophy</span>
            <h2>Transforming Ordinary Gifts Into Meaningful Experiences</h2>
            <p>
              We continuously explore emerging trends and innovative gifting concepts to bring fresh ideas to the corporate world.
            </p>
          </div>

          <div className="about-pillars-grid">
            <div className="about-pillar-card">
              <div className="pillar-icon-box">
                <i className="fa-solid fa-lightbulb"></i>
              </div>
              <h3>Thoughtful Innovation</h3>
              <p>
                We continuously explore emerging trends and innovative gifting concepts to bring fresh ideas to the corporate world, combining product selection with modern aesthetics.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon-box">
                <i className="fa-solid fa-fingerprint"></i>
              </div>
              <h3>Reflecting Brand Personality</h3>
              <p>
                Every organization has its own unique identity, values, and culture. We tailor every solution so your brand personality shines through precision engraving and bespoke packaging.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon-box">
                <i className="fa-solid fa-heart-circle-check"></i>
              </div>
              <h3>Meaningful Impact</h3>
              <p>
                A gift is a gesture of genuine appreciation. By combining personalization with attention to detail, we build lasting emotional connections that recipients cherish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why Choose Gifting Wellness? */}
      <section className="why-choose-section" aria-label="Why Choose Gifting Wellness">
        <div className="container">
          <div className="about-section-header">
            <span className="about-kicker">Enterprise Excellence</span>
            <h2>Why Choose Gifting Wellness?</h2>
            <p>
              Setting new standards in creativity, presentation, and seamless execution for corporate gifting across India.
            </p>
          </div>

          <div className="why-choose-grid">
            <div className="why-choose-card">
              <div className="why-icon-box">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3>Customized to Your Brand</h3>
              <p>
                Customized gifting solutions tailored to your brand identity, complete with UV digital printing, precision laser engraving, and custom packaging.
              </p>
            </div>

            <div className="why-choose-card">
              <div className="why-icon-box">
                <i className="fa-solid fa-coins"></i>
              </div>
              <h3>Options for All Budgets</h3>
              <p>
                Options for different occasions and budgets — from cost-effective delegate giveaways to ultra-premium executive and CXO hampers.
              </p>
            </div>

            <div className="why-choose-card">
              <div className="why-icon-box">
                <i className="fa-solid fa-fire-flame-curved"></i>
              </div>
              <h3>Curated & Trending</h3>
              <p>
                Thoughtfully curated and trending products, from temperature-display vacuum flasks and smart tech gadgets to sustainable bamboo and jute sets.
              </p>
            </div>

            <div className="why-choose-card">
              <div className="why-icon-box">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <h3>Bulk Gifting Support</h3>
              <p>
                Full bulk gifting support for enterprise requirements, Pan-India multi-location doorstep fulfillment, and compliant B2B GST tax billing.
              </p>
            </div>

            <div className="why-choose-card">
              <div className="why-icon-box">
                <i className="fa-solid fa-star"></i>
              </div>
              <h3>Quality & Presentation</h3>
              <p>
                An uncompromising focus on premium quality, luxury presentation, and customer satisfaction that makes every recipient feel truly valued.
              </p>
            </div>

            <div className="why-choose-card" style={{ background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-deep) 100%)", color: "var(--paper)" }}>
              <div className="why-icon-box" style={{ background: "rgba(255,255,255,0.15)", color: "var(--paper)" }}>
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <h3 style={{ color: "var(--paper)" }}>Ready to Partner?</h3>
              <p style={{ color: "var(--linen)" }}>
                Our corporate gifting advisors will curate a tailored proposal and free digital mockups within 2 hours.
              </p>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                style={{
                  marginTop: "auto",
                  padding: "9px 18px",
                  background: "var(--ribbon)",
                  border: "none",
                  borderRadius: "4px",
                  color: "var(--paper)",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  alignSelf: "flex-start",
                }}
              >
                Request Quotation →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Range of Gifting Offerings */}
      <section className="about-range-section" aria-label="Our Range of Solutions">
        <div className="container">
          <div className="about-section-header">
            <span className="about-kicker">Tailored for Every Milestone</span>
            <h2>A Diverse Range of Corporate Gifting Options</h2>
            <p>
              Customized merchandise, premium gifts, and festive hampers engineered to fit your business requirements and budget.
            </p>
          </div>

          <div className="about-range-grid">
            <div className="about-range-card">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"
                alt="Employee Welcome Kits"
                loading="lazy"
              />
              <div className="about-range-overlay">
                <h4>Employee Welcome Kits</h4>
                <p>Day-one onboarding hampers, branded stationery, tech kits, and anniversary mementos.</p>
              </div>
            </div>

            <div className="about-range-card">
              <img
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80"
                alt="Premium Executive Gifts"
                loading="lazy"
              />
              <div className="about-range-overlay">
                <h4>Premium Executive Gifts</h4>
                <p>Double-insulated flasks, luxury pens, leatherette organizers, and VIP speaker mementos.</p>
              </div>
            </div>

            <div className="about-range-card">
              <img
                src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80"
                alt="Festive Hampers"
                loading="lazy"
              />
              <div className="about-range-overlay">
                <h4>Festive Hampers</h4>
                <p>Diwali, New Year, and festival celebrations with gourmet sweets, brassware, and dry fruits.</p>
              </div>
            </div>

            <div className="about-range-card">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                alt="Event & Conference Giveaways"
                loading="lazy"
              />
              <div className="about-range-overlay">
                <h4>Event & Conference Giveaways</h4>
                <p>Delegate bags, wireless tech accessories, Bluetooth speakers, and custom giveaways.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Grand Closing Commitment / Mission Banner */}
      <div className="container">
        <section className="about-closing-banner" aria-label="Our Commitment">
          <div className="about-closing-content">
            <div className="about-closing-quote-mark">“</div>
            <h2 className="about-closing-tagline">
              Gifting Wellness — Corporate Gifting Solutions.<br />
              Thoughtfully Chosen. Meaningfully Delivered.
            </h2>
            <p className="about-closing-sub">
              Our commitment is to make corporate gifting simple, seamless, and impactful, helping organizations celebrate people, strengthen connections, and create moments that truly matter.
            </p>
            <div className="about-closing-actions">
              <button
                type="button"
                className="about-hero-btn-primary"
                onClick={() => setIsBulkModalOpen(true)}
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span>Get a Corporate Quote</span>
              </button>
              <Link to="/products" className="about-hero-btn-secondary">
                <i className="fa-solid fa-bag-shopping"></i>
                <span>Browse Full Catalog</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <BulkEnquiryModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
      <CatalogueDownloadModal
        isOpen={isCatalogueModalOpen}
        onClose={() => setIsCatalogueModalOpen(false)}
      />
    </div>
  );
};

export default AboutUs;
