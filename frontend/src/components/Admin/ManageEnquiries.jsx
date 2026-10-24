import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";

const ManageEnquiries = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("quotes"); // 'quotes' | 'enquiries'
  const [quotes, setQuotes] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editQuote, setEditQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ status: "", adminNotes: "" });
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resQuotes, resEnquiries] = await Promise.all([
        fetch(getAdminApiUrl("/api/quote"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getAdminApiUrl("/api/enquiries"), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resQuotes.ok) {
        const qData = await resQuotes.json();
        setQuotes(qData.quotes || []);
      }
      if (resEnquiries.ok) {
        const eData = await resEnquiries.json();
        setEnquiries(eData.enquiries || []);
      }
    } catch (err) {
      console.error("Failed to load corporate leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleOpenEditQuote = (q) => {
    setEditQuote(q);
    setQuoteForm({
      status: q.status || "pending_review",
      adminNotes: q.adminNotes || "",
    });
  };

  const handleSaveQuoteStatus = async (e) => {
    e.preventDefault();
    if (!editQuote) return;

    try {
      setUpdating(true);
      const res = await fetch(getAdminApiUrl(`/api/quote/${editQuote.quoteId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quoteForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQuotes((prev) =>
          prev.map((q) => (q.quoteId === editQuote.quoteId ? data.quote : q))
        );
        showToast(`Quote #${editQuote.quoteId} status updated successfully.`);
        setEditQuote(null);
      } else {
        alert(data.message || "Failed to update quote");
      }
    } catch (err) {
      alert("Error updating quote: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      term === "" ||
      q.quoteId?.toLowerCase().includes(term) ||
      q.companyName?.toLowerCase().includes(term) ||
      q.contactEmail?.toLowerCase().includes(term) ||
      q.productTitle?.toLowerCase().includes(term)
    );
  });

  const filteredEnquiries = enquiries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      term === "" ||
      e.enquiryId?.toLowerCase().includes(term) ||
      e.company?.toLowerCase().includes(term) ||
      e.email?.toLowerCase().includes(term) ||
      e.name?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "quoted":
      case "accepted":
        return { bg: "var(--sage-tint)", color: "var(--success)", border: "#a7f3d0", label: status.toUpperCase() };
      case "mockup_in_progress":
        return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "MOCKUP IN PROGRESS" };
      case "closed":
        return { bg: "var(--linen)", color: "var(--ink-soft)", border: "var(--line-strong)", label: "CLOSED" };
      default:
        return { bg: "var(--champagne-tint)", color: "var(--warning)", border: "#fde68a", label: "PENDING REVIEW" };
    }
  };

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-comments-dollar"></i> Corporate Inquiries & Quotations
              </h1>
              <p className="admin-page-desc">
                Review wholesale bulk quotations, corporate custom branding requests, and catalogue lookbook inquiries.
              </p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="btn-admin-action"
                onClick={fetchData}
                title="Refresh leads"
              >
                <i className="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>
          </div>

          {toast && (
            <div className="admin-action-banner success" style={{ marginBottom: "20px" }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{toast}</span>
            </div>
          )}

          {/* Tab Selector & Search */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "20px", background: "var(--paper)", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("quotes")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: activeTab === "quotes" ? "var(--forest)" : "var(--linen)",
                  color: activeTab === "quotes" ? "var(--paper)" : "var(--ink-soft)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: "6px" }}></i>
                Bulk Quotes ({quotes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("enquiries")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: activeTab === "enquiries" ? "var(--forest)" : "var(--linen)",
                  color: activeTab === "enquiries" ? "var(--paper)" : "var(--ink-soft)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-envelope-open-text" style={{ marginRight: "6px" }}></i>
                General Enquiries ({enquiries.length})
              </button>
            </div>

            <div style={{ position: "relative", minWidth: "260px" }}>
              <input
                type="text"
                placeholder="Search by company, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid var(--line-strong)", borderRadius: "8px", fontSize: "14px" }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "14px", color: "var(--muted)" }}></i>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: "var(--forest)" }}></i>
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading inquiries...</p>
            </div>
          ) : activeTab === "quotes" ? (
            /* Quotes View */
            filteredQuotes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
                <i className="fa-solid fa-clipboard-question fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
                <h3 style={{ fontSize: "18px", color: "var(--ink)", margin: "0 0 6px" }}>No bulk quotations requested yet</h3>
                <p style={{ color: "var(--muted)", margin: 0 }}>Customer quote submissions from product pages will appear here in real-time.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredQuotes.map((q) => {
                  const badge = getStatusBadge(q.status);
                  return (
                    <div
                      key={q.quoteId}
                      style={{
                        background: "var(--paper)",
                        borderRadius: "12px",
                        border: "1px solid var(--line)",
                        padding: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--linen)", paddingBottom: "12px", marginBottom: "14px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", margin: 0 }}>
                              {q.companyName}
                            </h2>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "16px",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            Lead #{q.quoteId} · Requested on {new Date(q.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <a
                            href={`mailto:${q.contactEmail}?subject=Giftingwellness Quotation: ${encodeURIComponent(q.productTitle)}`}
                            style={{
                              padding: "8px 14px",
                              background: "var(--linen)",
                              color: "var(--ink)",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-envelope"></i> Reply via Email
                          </a>
                          {q.contactPhone && (
                            <a
                              href={`https://wa.me/${q.contactPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 14px",
                                background: "#25d366",
                                color: "var(--paper)",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <i className="fa-brands fa-whatsapp"></i> WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuote(q)}
                            style={{
                              padding: "8px 14px",
                              background: "var(--forest)",
                              color: "var(--paper)",
                              borderRadius: "8px",
                              border: "none",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Update Status
                          </button>
                        </div>
                      </div>

                      {/* Quote Content Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                        <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px" }}>Product & Quantity</h4>
                          <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--ink)" }}>{q.productTitle}</p>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)" }}>Quantity: <strong>{q.quantity} units</strong></p>
                          {q.estimatedTotal && (
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--forest)", fontWeight: "700" }}>
                              Est. Value: ₹{Number(q.estimatedTotal).toFixed(2)} (inc. 18% GST)
                            </p>
                          )}
                        </div>

                        <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px" }}>Branding Details</h4>
                          <p style={{ margin: "0 0 4px", fontSize: "13px" }}>Branding Method: <strong>{q.brandingOption || "UV Print"}</strong></p>
                          {q.customText && (
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--forest)" }}>
                              Logo / Text: <strong>"{q.customText}"</strong>
                            </p>
                          )}
                          {q.notes && (
                            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                              Notes: "{q.notes}"
                            </p>
                          )}
                        </div>

                        <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px" }}>Contact Person</h4>
                          <p style={{ margin: "0 0 4px", fontWeight: "600", color: "var(--ink)" }}>{q.contactName || "Corporate Buyer"}</p>
                          <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--ink-soft)" }}>{q.contactEmail}</p>
                          {q.contactPhone && <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)" }}>{q.contactPhone}</p>}
                          {q.pincode && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>Pincode: {q.pincode}</p>}
                        </div>
                      </div>

                      {q.adminNotes && (
                        <div style={{ marginTop: "12px", padding: "10px", background: "var(--champagne-tint)", border: "1px dashed #fef08a", borderRadius: "6px", fontSize: "13px", color: "#713f12" }}>
                          <strong>Internal Staff Note:</strong> {q.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* General Enquiries View */
            filteredEnquiries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
                <i className="fa-solid fa-inbox fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
                <h3 style={{ fontSize: "18px", color: "var(--ink)", margin: "0 0 6px" }}>No corporate enquiries yet</h3>
                <p style={{ color: "var(--muted)", margin: 0 }}>Submissions from the header 'Bulk Enquiry' and lookbook download modals will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredEnquiries.map((enq) => (
                  <div
                    key={enq.enquiryId}
                    style={{
                      background: "var(--paper)",
                      borderRadius: "12px",
                      border: "1px solid var(--line)",
                      padding: "20px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", margin: "0 0 4px" }}>
                          {enq.company || enq.name}
                        </h2>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          Enquiry #{enq.enquiryId} · {new Date(enq.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <a
                          href={`mailto:${enq.email}?subject=Giftingwellness Corporate Gifting Enquiry`}
                          style={{
                            padding: "8px 14px",
                            background: "var(--linen)",
                            color: "var(--ink)",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="fa-solid fa-envelope"></i> Email
                        </a>
                        {enq.phone && (
                          <a
                            href={`https://wa.me/${enq.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "8px 14px",
                              background: "#25d366",
                              color: "var(--paper)",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-brands fa-whatsapp"></i> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", background: "var(--ivory)", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Contact Person:</span>
                        <p style={{ margin: "2px 0 0", fontWeight: "600" }}>{enq.name}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Category:</span>
                        <p style={{ margin: "2px 0 0", fontWeight: "600" }}>{enq.category || "General Gifting"}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Quantity Required:</span>
                        <p style={{ margin: "2px 0 0", fontWeight: "600" }}>{enq.quantity || "100 units"}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Custom Branding:</span>
                        <p style={{ margin: "2px 0 0", fontWeight: "600" }}>{enq.customBranding || "Yes"}</p>
                      </div>
                    </div>

                    {enq.notes && (
                      <p style={{ margin: "12px 0 0", fontSize: "13px", color: "var(--ink-soft)", background: "var(--linen)", padding: "10px", borderRadius: "6px" }}>
                        <strong>Requirements / Notes:</strong> {enq.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Edit Quote Status Modal */}
          {editQuote && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px",
              }}
            >
              <div
                style={{
                  background: "var(--paper)",
                  borderRadius: "14px",
                  maxWidth: "480px",
                  width: "100%",
                  padding: "24px",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--ink)" }}>
                    Update Quote · #{editQuote.quoteId}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditQuote(null)}
                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--muted)" }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveQuoteStatus}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Pipeline Status:
                    </label>
                    <select
                      value={quoteForm.status}
                      onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    >
                      <option value="pending_review">Pending Review (New Lead)</option>
                      <option value="mockup_in_progress">Mockup In Progress (Design Team)</option>
                      <option value="quoted">Quoted / Proposal Sent</option>
                      <option value="accepted">Accepted / Converting to Order</option>
                      <option value="closed">Closed / Cancelled</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Internal Staff Notes:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Shared quotation PDF via email at ₹310/pc for 250 units."
                      value={quoteForm.adminNotes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, adminNotes: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setEditQuote(null)}
                      style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--ivory)", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--forest)", color: "var(--paper)", fontWeight: "600", cursor: "pointer" }}
                    >
                      {updating ? "Saving..." : "Save Status"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminRoute>
  );
};

export default ManageEnquiries;
