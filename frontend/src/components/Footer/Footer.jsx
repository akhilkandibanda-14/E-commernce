import SocMediaIcons from "../Misc/SocMediaIcons";
import { Link } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const Footer = () => {
  const { contactInfo } = useSiteContent();

  return (
    <footer className="luxury-footer" aria-label="Footer">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-column">
            <Link to="/" className="footer-brand-logo" aria-label="Giftingwellness Home">
              <img
                src="/giftingwellness-logo.png"
                alt="Giftingwellness Logo"
                className="footer-brand-img"
              />
              <div className="footer-brand-text-block">
                <span className="logo-wordmark">Giftingwellness</span>
                <span className="logo-subtitle">Corporate gifting solutions</span>
              </div>
            </Link>
            <p className="footer-brand-desc">
              Founded by Ravi Kinnera in 2019 in Hyderabad, Giftingwellness is a premier corporate gifting solutions company. Thoughtfully chosen. Meaningfully delivered.
            </p>
            <div className="footer-contact-snippet">
              <p>
                <i className="fa-solid fa-phone" style={{ marginRight: "6px", color: "var(--ribbon)" }}></i>
                {contactInfo.phonePrimary}
              </p>
              <p>
                <i className="fa-solid fa-envelope" style={{ marginRight: "6px", color: "var(--ribbon)" }}></i>
                {contactInfo.emailBulk}
              </p>
            </div>
            <div className="footer-social-wrapper">
              <SocMediaIcons />
            </div>
          </div>

          {/* Core Categories Column */}
          <div className="footer-links-column">
            <h3 className="footer-column-heading">Gifting Categories</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/products?search=Bottle">Bottles & Insulated Flasks</Link>
              </li>
              <li>
                <Link to="/products?search=Mug">Ceramic & Cork Mugs</Link>
              </li>
              <li>
                <Link to="/products?search=Bag">Bags & Executive Backpacks</Link>
              </li>
              <li>
                <Link to="/products?search=Gadget">Tech & Electrical Gadgets</Link>
              </li>
              <li>
                <Link to="/products?search=Pen">Executive Pens & Stylus</Link>
              </li>
              <li>
                <Link to="/products?search=Notebook">Diaries & Organizers</Link>
              </li>
            </ul>
          </div>

          {/* Bespoke Services Column */}
          <div className="footer-links-column">
            <h3 className="footer-column-heading">Gifting Services</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/products?search=Corporate">Corporate Gifting</Link>
              </li>
              <li>
                <Link to="/products?search=Employee">Employee Joining Kits</Link>
              </li>
              <li>
                <Link to="/products?search=Return">Return Gifting for Events</Link>
              </li>
              <li>
                <Link to="/products?search=Conference">Conference & Summit Swags</Link>
              </li>
              <li>
                <Link to="/products?search=Festive">Diwali & Festive Hampers</Link>
              </li>
              <li>
                <Link to="/products?search=Branded">Branded Corporate Catalog</Link>
              </li>
            </ul>
          </div>

          {/* Corporate Support Column */}
          <div className="footer-links-column">
            <h3 className="footer-column-heading">Trust & Support</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/about">About Giftingwellness</Link>
              </li>
              <li>
                <Link to="/shipping-policy">Shipping & Delivery Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy">Refund & Replacements</Link>
              </li>
              <li>
                <Link to="/terms">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="footer-bottom-bar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", marginTop: "30px" }}>
          <div className="footer-copyright-text" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
            © {new Date().getFullYear()} GIFTINGWELLNESS. All rights reserved. Thoughtfully Chosen. Meaningfully Delivered.
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
            <Link to="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Terms of Service</Link>
            <Link to="/refund-policy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Refund Policy</Link>
            <Link to="/shipping-policy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Shipping Policy</Link>
            <Link to="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Privacy</Link>
          </div>

          <div className="footer-payment-methods">
            <span className="payment-badge-text">
              <i className="fa-solid fa-shield-halved" style={{ marginRight: "6px", color: "var(--success)" }}></i>
              Official GST 18% Tax Billing · Pan-India Courier Dispatch
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
