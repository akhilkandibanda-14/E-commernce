import { useEffect, useRef, useState } from "react";
import { CATALOGUES_LIST, CONTACT_INFO } from "../../data/navigationData";
import { useAuth } from "../../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CatalogueDownloadModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    catalogueId: "all-catalogues",
    catalogueTitle: "All Corporate Catalogues (Complete 2026 Collection)",
    notes: "I need to download the catalogue for corporate gifting review.",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedReq, setSubmittedReq] = useState(null);
  const [error, setError] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSubmittedReq(null);
      setError("");
      return undefined;
    }

    // Pre-fill user profile info if logged in
    setFormData((prev) => ({
      ...prev,
      name: user?.name || prev.name || "",
      email: user?.email || prev.email || "",
      phone: user?.phone || prev.phone || "",
      company: user?.company || prev.company || "",
    }));

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    setTimeout(() => {
      nameRef.current?.focus();
    }, 100);

    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, user, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "catalogueId") {
      let title = "All Corporate Catalogues (Complete 2026 Collection)";
      if (value !== "all-catalogues") {
        const found = CATALOGUES_LIST.find((c) => c.id === value);
        if (found) title = found.title;
      }
      setFormData((prev) => ({ ...prev, catalogueId: value, catalogueTitle: title }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError("");
  };

  const handleSelectQuickCatalog = (catalog) => {
    setFormData((prev) => ({
      ...prev,
      catalogueId: catalog.id,
      catalogueTitle: catalog.title,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError("Please enter your name so our admin knows who is requesting the catalogue.");
      nameRef.current?.focus();
      return;
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid work email address so we can email the catalogue.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        catalogueId: formData.catalogueId,
        catalogueTitle: formData.catalogueTitle,
        notes: formData.notes.trim() || "I need to download the catalogue for corporate gifting.",
        type: "catalogue_request",
      };

      // Primary submit to dedicated catalogue-requests endpoint
      let res = await fetch("/api/catalogue-requests", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      // Fallback to /api/enquiries if needed
      if (!res.ok && res.status === 404) {
        res = await fetch("/api/enquiries", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...payload,
            category: `Catalogue request: ${formData.catalogueTitle}`,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Failed to submit request to admin. Please try again.");
        return;
      }

      setSubmittedReq({
        requestId: data.requestId || `CAT-${Date.now().toString(36).toUpperCase()}`,
        catalogueTitle: formData.catalogueTitle,
        email: trimmedEmail,
        phone: formData.phone.trim(),
      });
    } catch {
      setError("Unable to connect to the server. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div
        className="catalogue-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogue-modal-title"
        style={{ maxWidth: "720px", padding: "28px" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close catalogues modal"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>

        {submittedReq ? (
          /* Confirmation Success State */
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--sage-tint)",
                color: "var(--forest)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              <i className="fa-solid fa-circle-check"></i>
            </div>

            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "700",
                background: "var(--champagne-tint)",
                color: "var(--earth)",
                marginBottom: "12px",
                border: "1px solid #fde68a",
              }}
            >
              Ref ID: #{submittedReq.requestId}
            </div>

            <h2 style={{ fontSize: "24px", color: "var(--ink)", margin: "0 0 10px" }}>
              Request Sent to Admin!
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--ink-soft)",
                lineHeight: "1.6",
                maxWidth: "520px",
                margin: "0 auto 20px",
              }}
            >
              Your request to download <strong>{submittedReq.catalogueTitle}</strong> has been
              received by our administrator. We will review and email you the official PDF download
              link to <strong>{submittedReq.email}</strong> promptly.
            </p>

            <div
              style={{
                background: "var(--ivory)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid var(--line)",
                marginBottom: "24px",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--forest)", fontWeight: "600", marginBottom: "6px" }}>
                <i className="fa-solid fa-clock-rotate-left"></i> Admin Turnaround: Within 2 Working Hours
              </div>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: "1.5" }}>
                Our corporate advisors will send you the latest high-resolution catalogue alongside volume tier discounts and custom branding guidelines.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSubmittedReq(null)}
                className="btn-luxury btn-outline"
                style={{ padding: "10px 20px" }}
              >
                <i className="fa-solid fa-plus"></i> Request Another Catalogue
              </button>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20have%20submitted%20request%20${submittedReq.requestId}%20to%20download%20the%20${encodeURIComponent(submittedReq.catalogueTitle)}.%20Please%20share%20the%20PDF%20link.`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#25d366",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <i className="fa-brands fa-whatsapp"></i> Instant WhatsApp Dispatch
              </a>
              <button
                type="button"
                onClick={onClose}
                className="btn-luxury btn-primary"
                style={{ padding: "10px 24px" }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Request Form */
          <div>
            <div className="catalogue-modal-header" style={{ marginBottom: "18px" }}>
              <span className="catalogue-kicker" style={{ background: "var(--sage-tint)", color: "var(--forest)", border: "1px solid #bbf7d0" }}>
                <i className="fa-solid fa-file-arrow-down"></i> Official Catalogue Download
              </span>
              <h2 id="catalogue-modal-title" style={{ marginTop: "6px" }}>
                Request Catalogue Download
              </h2>
              <p>
                Fill out the request form below to receive the latest Giftingwellness wholesale catalogues,
                complete with technical specifications, colorways, and bulk volume rates.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: "var(--danger-tint)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="req-name" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                    Your Name <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="req-name"
                    ref={nameRef}
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="req-email" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                    Work Email <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="req-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="req-phone" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                    Phone / WhatsApp Number <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="req-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="req-company" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                    Company / Organization (Optional)
                  </label>
                  <input
                    id="req-company"
                    name="company"
                    type="text"
                    placeholder="e.g. Acme Technologies"
                    value={formData.company}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label htmlFor="req-catalog" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                  Select Catalogue to Download:
                </label>
                <select
                  id="req-catalog"
                  name="catalogueId"
                  value={formData.catalogueId}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px", background: "var(--paper)" }}
                >
                  <option value="all-catalogues">
                    📚 All Corporate Catalogues (Complete 2026 Collection)
                  </option>
                  {CATALOGUES_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      📄 {c.title} ({c.pages} · {c.size})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Select Catalogue Chips */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                  Or click below to quickly select:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                  {CATALOGUES_LIST.map((c) => {
                    const isSelected = formData.catalogueId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectQuickCatalog(c)}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid var(--forest)" : "1px solid var(--line)",
                          background: isSelected ? "var(--ivory)" : "var(--paper)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <i className={c.icon} style={{ color: c.color || "var(--forest)", fontSize: "16px" }}></i>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: "12px", fontWeight: isSelected ? "700" : "500", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {c.pages} · {c.size}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label htmlFor="req-notes" style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                  Request Message / Special Notes:
                </label>
                <textarea
                  id="req-notes"
                  name="notes"
                  rows={2}
                  placeholder="e.g., I need to download the catalogue to select corporate gifts for our upcoming annual event."
                  value={formData.notes}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--linen)",
                    color: "var(--ink)",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--forest)",
                    color: "var(--paper)",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Submitting Request...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Send Request to Admin
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="catalogue-modal-footer" style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
              <div className="catalogue-whatsapp-box" style={{ margin: 0 }}>
                <i className="fa-brands fa-whatsapp whatsapp-icon" aria-hidden="true"></i>
                <div>
                  <strong>Need Instant Download on WhatsApp?</strong>
                  <p>Message our B2B team directly and we'll reply with the catalogue PDF immediately.</p>
                </div>
                <a
                  href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "")}?text=Please%20send%20me%20the%20complete%20Corporate%20Gifting%20Catalogues%20PDF`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp-cat-link"
                >
                  WhatsApp Now
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogueDownloadModal;
