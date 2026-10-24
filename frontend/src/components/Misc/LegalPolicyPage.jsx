import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSiteContent } from "../../context/SiteContentContext";

const LegalPolicyPage = () => {
  const location = useLocation();
  const { contactInfo } = useSiteContent();

  const getInitialTab = () => {
    if (location.pathname.includes("refund")) return "refund";
    if (location.pathname.includes("shipping")) return "shipping";
    if (location.pathname.includes("privacy")) return "privacy";
    return "terms";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <main className="container" style={{ padding: "40px 20px 80px", maxWidth: "960px", minHeight: "75vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--forest)", fontWeight: "700" }}>
          Trust & Regulatory Compliance
        </span>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--ink)", margin: "8px 0" }}>
          Policies & Legal Guidelines
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
          Giftingwellness Corporate Gifting Solutions · Transparent terms for retail and corporate procurement.
        </p>
      </div>

      {/* Policy Navigation Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "36px" }}>
        {[
          { id: "terms", path: "/terms", label: "Terms & Conditions", icon: "fa-scale-balanced" },
          { id: "refund", path: "/refund-policy", label: "Refund & Replacements", icon: "fa-rotate-left" },
          { id: "shipping", path: "/shipping-policy", label: "Shipping & Delivery", icon: "fa-truck-fast" },
          { id: "privacy", path: "/privacy", label: "Privacy Policy", icon: "fa-shield-halved" },
        ].map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "24px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === tab.id ? "var(--forest)" : "var(--linen)",
              color: activeTab === tab.id ? "var(--paper)" : "var(--ink-soft)",
              border: `1px solid ${activeTab === tab.id ? "var(--forest)" : "var(--line)"}`,
              transition: "all 0.2s ease",
            }}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </Link>
        ))}
      </div>

      {/* Content Container */}
      <div style={{ background: "var(--paper)", padding: "36px", borderRadius: "16px", border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", lineHeight: "1.7", color: "var(--ink-soft)" }}>
        {/* TERMS AND CONDITIONS */}
        {activeTab === "terms" && (
          <article>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--ink)", marginBottom: "16px" }}>
              Terms & Conditions of Sale
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Last updated: October 2026</p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "24px" }}>1. Acceptance of Terms</h3>
            <p>
              By accessing Giftingwellness (operated from Hyderabad, Telangana, India) or placing an order through this website, corporate clients and retail buyers agree to be bound by these Terms and Conditions.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>2. Custom Logo Branding & Digital Mockup Approval</h3>
            <p>
              For orders requesting custom logo branding (Screen Printing, Laser Engraving, or Digital UV Print), our design team prepares a complimentary 3D digital mockup. Production begins only after the client approves the digital proof.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>3. Wholesale Tier Pricing & Quotations</h3>
            <p>
              Wholesale volume tier prices displayed on product pages apply strictly to single-order quantities reaching the respective threshold. Official quotation proposals shared via email remain valid for 15 days from the date of issue.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>4. Taxes & Invoicing (GST Compliance)</h3>
            <p>
              All corporate purchases are invoiced in accordance with Indian Goods and Services Tax (GST) laws with an itemized 18% GST tax invoice for B2B input tax credit eligibility.
            </p>
          </article>
        )}

        {/* REFUND AND CANCELLATION */}
        {activeTab === "refund" && (
          <article>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--ink)", marginBottom: "16px" }}>
              Return, Replacement & Cancellation Policy
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Last updated: October 2026</p>

            <div style={{ background: "var(--champagne-tint)", border: "1px solid #fde68a", padding: "14px 18px", borderRadius: "10px", margin: "16px 0", color: "var(--warning)" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "8px" }}></i>
              <strong>Important Notice on Custom Branded Merchandise:</strong> Because corporate merchandise is personalized with your specific logo, customized items cannot be cancelled or returned once physical production has commenced.
            </div>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "24px" }}>1. Transit Damage & Manufacturing Defect Guarantee</h3>
            <p>
              If any items in your gift shipment arrive broken, damaged in transit, or exhibit manufacturing print defects, Giftingwellness guarantees immediate replacement or reprint at zero cost. Please report within 7 days of receiving the parcel along with unboxing photos/video to {contactInfo?.emailBulk || "support@giftingwellness.com"}.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>2. Plain / Unbranded Sample Orders</h3>
            <p>
              Non-personalized sample items in their original, unused packaging may be returned within 7 days of delivery for a full product refund (excluding return courier charges).
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>3. Order Cancellations</h3>
            <p>
              Orders may be cancelled free of charge before artwork mockup confirmation. Once proof approval has been provided and printing screens or laser jigs are set up, cancellation fees apply to cover raw materials used.
            </p>
          </article>
        )}

        {/* SHIPPING AND DELIVERY */}
        {activeTab === "shipping" && (
          <article>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--ink)", marginBottom: "16px" }}>
              Shipping & Delivery Policy
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Last updated: October 2026</p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "24px" }}>1. Dispatch Timelines</h3>
            <ul>
              <li><strong>Plain / Ready Stock Merchandise:</strong> Dispatched within 2 to 3 business days.</li>
              <li><strong>Custom Logo Branded Corporate Orders:</strong> Dispatched within 7 to 10 business days following digital artwork approval.</li>
              <li><strong>Festive Peak Seasons (Diwali, New Year):</strong> We recommend placing corporate orders 14 days in advance.</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>2. Courier Partners & Tracking</h3>
            <p>
              We partner with tier-1 logistics carriers including BlueDart, Delhivery, DTDC, and Shiprocket. Live tracking details with AWB numbers are emailed to the customer upon shipment.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>3. Multi-City Corporate Doorstep Dispatch</h3>
            <p>
              For hybrid and remote teams, Giftingwellness provides door-to-door pan-India delivery to individual employee home addresses across 19,000+ pincodes.
            </p>
          </article>
        )}

        {/* PRIVACY POLICY */}
        {activeTab === "privacy" && (
          <article>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--ink)", marginBottom: "16px" }}>
              Privacy Policy
            </h2>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Last updated: October 2026</p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "24px" }}>1. Information We Collect</h3>
            <p>
              We collect details necessary to process corporate gifting orders: company name, contact email, phone number, GSTIN, shipping destination addresses, and custom gift card messages.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>2. Confidentiality of Client Logos & Artwork</h3>
            <p>
              Client vector files, brand trademarks, and recipient greeting messages remain strictly confidential and are used solely for fulfilling your authorized order.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--forest)", marginTop: "20px" }}>3. Data Security</h3>
            <p>
              All interactions on this platform are encrypted via 256-bit Secure Socket Layer (SSL/TLS). We never sell or share corporate contact information with third-party advertisers.
            </p>
          </article>
        )}

        {/* Contact Strip */}
        <div style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid var(--line)", background: "var(--ivory)", padding: "18px", borderRadius: "10px", fontSize: "13px" }}>
          <p style={{ margin: "0 0 6px", fontWeight: "700", color: "var(--ink)" }}>
            <i className="fa-solid fa-building" style={{ marginRight: "6px", color: "var(--forest)" }}></i>
            Registered Corporate Office:
          </p>
          <p style={{ margin: "0 0 4px" }}>Giftingwellness Corporate Gifting Solutions, Hyderabad, Telangana 500081, India</p>
          <p style={{ margin: 0 }}>
            Contact Support: <strong>{contactInfo?.phonePrimary || "+91 91212 99914"}</strong> · Email: <strong>{contactInfo?.emailBulk || "sales@giftingwellness.com"}</strong>
          </p>
        </div>
      </div>
    </main>
  );
};

export default LegalPolicyPage;
