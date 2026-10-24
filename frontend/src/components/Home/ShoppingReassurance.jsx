import { Link } from "react-router-dom";

const POLICIES = [
  {
    id: "sample-mockup",
    icon: "fa-solid fa-wand-magic-sparkles",
    title: "Free Digital Mockup Proofs",
    detail: "See your company logo rendered on any mug, bottle, backpack, or pen within 24 hours before manufacturing.",
    actionText: "Request Mockup",
    link: "/products",
    badge: "24h Turnaround",
  },
  {
    id: "gst-billing",
    icon: "fa-solid fa-receipt",
    title: "B2B GST Tax Invoicing",
    detail: "Official 18% GST tax invoices generated with your company GSTIN to claim full corporate input tax credit.",
    actionText: "Billing Info",
    link: "/products",
    badge: "100% Compliant",
  },
  {
    id: "multi-location",
    icon: "fa-solid fa-truck-fast",
    title: "Multi-Address Delivery",
    detail: "Effortlessly send gifts to 100+ remote employee home residences or single consolidated company branches.",
    actionText: "Delivery Specs",
    link: "/products",
    badge: "Pan-India",
  },
  {
    id: "account-manager",
    icon: "fa-solid fa-headset",
    title: "Dedicated B2B Concierge",
    detail: "Direct WhatsApp and phone assistance for corporate quotes, bulk tier discounts, and order dispatch tracking.",
    actionText: "Get In Touch",
    link: "/products",
    badge: "Priority Care",
  },
];

const ShoppingReassurance = () => {
  return (
    <section className="shopping-reassurance-section" aria-label="Corporate Gifting Guarantees">
      <div className="container">
        <div className="reassurance-header">
          <h2 className="reassurance-title title">Seamless Corporate Gifting, End-to-End</h2>
          <p className="reassurance-subtitle">
            From digital proofing to doorstep distribution, we manage every detail so you can focus on your business.
          </p>
        </div>

        <div className="reassurance-grid">
          {POLICIES.map((p) => (
            <div key={p.id} className="reassurance-card">
              <div className="reassurance-card-top">
                <div className="reassurance-icon">
                  <i className={p.icon}></i>
                </div>
                <span className="reassurance-badge">{p.badge}</span>
              </div>

              <h3 className="reassurance-card-title">{p.title}</h3>
              <p className="reassurance-card-detail">{p.detail}</p>

              <Link to={p.link} className="reassurance-card-link">
                {p.actionText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoppingReassurance;
