import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";

const CATALOGUES_METADATA = {
  "corp-master-2026": {
    title: "Corporate Gifting Master Catalogue 2026",
    size: "14.2 MB",
    pages: "92 Pages",
    icon: "fa-solid fa-file-pdf",
    color: "#b65c45",
  },
  "festive-hampers-2026": {
    title: "Diwali & Festive Luxury Hampers Guide",
    size: "9.8 MB",
    pages: "48 Pages",
    icon: "fa-solid fa-file-pdf",
    color: "#d97706",
  },
  "branded-tech-2026": {
    title: "Branded Gadgets & Smart Electronics",
    size: "8.1 MB",
    pages: "36 Pages",
    icon: "fa-solid fa-file-pdf",
    color: "#2563eb",
  },
  "eco-green-2026": {
    title: "Eco-Friendly & Sustainable Gifts Collection",
    size: "6.5 MB",
    pages: "28 Pages",
    icon: "fa-solid fa-file-pdf",
    color: "#059669",
  },
  "all-catalogues": {
    title: "All Corporate Catalogues (Complete 2026 Collection)",
    size: "38.6 MB Bundle",
    pages: "204 Pages",
    icon: "fa-solid fa-book",
    color: "#047857",
  },
};

const ManageCatalogueRequests = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editRequest, setEditRequest] = useState(null);
  const [editForm, setEditForm] = useState({ status: "", adminNotes: "" });
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(getAdminApiUrl("/api/catalogue-requests"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        // Fallback: check general enquiries if catalogue-requests endpoint returns empty/fallback
        const enqRes = await fetch(getAdminApiUrl("/api/enquiries"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (enqRes.ok) {
          const eData = await enqRes.json();
          const list = (eData.enquiries || [])
            .filter((e) => e.category?.toLowerCase().includes("catalogue") || e.type === "catalogue_request")
            .map((e) => ({
              requestId: e.enquiryId,
              name: e.name || "Customer",
              email: e.email,
              phone: e.phone || "",
              company: e.company || "",
              catalogueTitle: e.category?.replace(/^Catalogue request:\s*/i, "") || "Corporate Gifting Catalogue",
              catalogueId: e.catalogueId || "corp-master-2026",
              notes: e.notes || "Requested catalogue download.",
              status: e.status || "pending",
              adminNotes: e.adminNotes || "",
              createdAt: e.createdAt,
            }));
          setRequests(list);
        }
      }
    } catch (err) {
      console.error("Failed to load catalogue requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleOpenEdit = (r) => {
    setEditRequest(r);
    setEditForm({
      status: r.status || "pending",
      adminNotes: r.adminNotes || "",
    });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editRequest) return;

    try {
      setUpdating(true);
      const res = await fetch(getAdminApiUrl(`/api/catalogue-requests/${editRequest.requestId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) =>
          prev.map((r) => (r.requestId === editRequest.requestId ? { ...r, ...data.request } : r))
        );
        showToast(`Request #${editRequest.requestId} updated successfully.`);
        setEditRequest(null);
      } else {
        alert(data.message || "Failed to update catalogue request.");
      }
    } catch (err) {
      alert("Error updating request: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickApprove = async (r) => {
    try {
      const res = await fetch(getAdminApiUrl(`/api/catalogue-requests/${r.requestId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "approved",
          adminNotes: "Catalogue link approved & dispatched by Admin.",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) =>
          prev.map((item) => (item.requestId === r.requestId ? { ...item, status: "approved", adminNotes: "Catalogue link approved & dispatched by Admin." } : item))
        );
        showToast(`Approved Request #${r.requestId}! Customer can receive catalogue.`);
      }
    } catch (err) {
      alert("Error approving request: " + err.message);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm(`Are you sure you want to delete request #${requestId}?`)) return;

    try {
      const res = await fetch(getAdminApiUrl(`/api/catalogue-requests/${requestId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        showToast(`Request #${requestId} has been removed.`);
      } else {
        alert(data.message || "Failed to delete request.");
      }
    } catch (err) {
      alert("Error deleting request: " + err.message);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      term === "" ||
      r.requestId?.toLowerCase().includes(term) ||
      r.name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.phone?.toLowerCase().includes(term) ||
      r.company?.toLowerCase().includes(term) ||
      r.catalogueTitle?.toLowerCase().includes(term) ||
      r.notes?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (r.status === "pending" || !r.status)) ||
      (statusFilter === "approved" && (r.status === "approved" || r.status === "sent")) ||
      (statusFilter === "closed" && (r.status === "closed" || r.status === "rejected"));

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
      case "sent":
        return { bg: "var(--sage-tint)", color: "var(--success)", border: "#a7f3d0", label: "APPROVED & SENT" };
      case "in_review":
        return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "IN REVIEW" };
      case "closed":
      case "rejected":
        return { bg: "var(--linen)", color: "var(--ink-soft)", border: "var(--line-strong)", label: "CLOSED" };
      default:
        return { bg: "var(--champagne-tint)", color: "var(--warning)", border: "#fde68a", label: "PENDING REVIEW" };
    }
  };

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending" || !r.status).length;
  const approvedCount = requests.filter((r) => r.status === "approved" || r.status === "sent").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = requests.filter((r) => r.createdAt && r.createdAt.startsWith(todayStr)).length;

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Header Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-file-arrow-down" style={{ color: "var(--forest)" }}></i> Customer Catalogue Download Requests
              </h1>
              <p className="admin-page-desc">
                Review and approve requests from customers who want to download corporate catalogues. Dispatch download links, volume price sheets, or reply via Email & WhatsApp.
              </p>
            </div>
            <div className="admin-header-actions">
              <Link to="/admin/quotes" className="btn-admin-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-comments-dollar"></i> Quotes & Enquiries
              </Link>
              <button
                type="button"
                className="btn-admin-action"
                onClick={fetchRequests}
                title="Refresh catalogue requests"
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

          {/* KPI Summary Cards */}
          <section className="admin-kpi-grid" style={{ marginBottom: "24px" }}>
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-blue">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Catalogue Requests</span>
                <span className="kpi-number">{totalCount}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-amber">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Pending Approval</span>
                <span className="kpi-number">{pendingCount}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-green">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Approved & Sent</span>
                <span className="kpi-number">{approvedCount}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-purple">
                <i className="fa-solid fa-calendar-day"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Requests Today</span>
                <span className="kpi-number">{todayCount}</span>
              </div>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              marginBottom: "20px",
              background: "var(--paper)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--line)",
            }}
          >
            {/* Status Filter Tabs */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: statusFilter === "all" ? "var(--forest)" : "var(--linen)",
                  color: statusFilter === "all" ? "var(--paper)" : "var(--ink-soft)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                All Requests ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: statusFilter === "pending" ? "var(--forest)" : "var(--linen)",
                  color: statusFilter === "pending" ? "var(--paper)" : "var(--ink-soft)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: statusFilter === "approved" ? "var(--forest)" : "var(--linen)",
                  color: statusFilter === "approved" ? "var(--paper)" : "var(--ink-soft)",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Approved / Sent ({approvedCount})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "280px" }}>
              <input
                type="text"
                placeholder="Search by customer, email, catalogue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 36px",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ position: "absolute", left: "12px", top: "13px", color: "var(--muted)" }}
              ></i>
            </div>
          </div>

          {/* Requests Content */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: "var(--forest)" }}></i>
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading catalogue download requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--paper)",
                borderRadius: "12px",
                border: "1px solid var(--line)",
              }}
            >
              <i className="fa-solid fa-book-open-reader fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
              <h3 style={{ fontSize: "18px", color: "var(--ink)", margin: "0 0 6px" }}>
                No catalogue download requests found
              </h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                When customers submit requests to download corporate catalogues, they will appear here in real-time.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredRequests.map((r) => {
                const badge = getStatusBadge(r.status);
                const catalogMeta =
                  CATALOGUES_METADATA[r.catalogueId] ||
                  Object.values(CATALOGUES_METADATA).find((m) => m.title === r.catalogueTitle) || {
                    title: r.catalogueTitle || "Corporate Gifting Catalogue",
                    icon: "fa-solid fa-file-pdf",
                    color: "var(--forest)",
                    size: "PDF Catalogue",
                    pages: "Complete Edition",
                  };

                return (
                  <div
                    key={r.requestId}
                    style={{
                      background: "var(--paper)",
                      borderRadius: "14px",
                      border: "1px solid var(--line)",
                      padding: "22px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    {/* Top Row: Customer & Request Meta */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        borderBottom: "1px solid var(--linen)",
                        paddingBottom: "14px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", margin: 0 }}>
                            {r.name}
                          </h2>
                          {r.company && (
                            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>
                              · {r.company}
                            </span>
                          )}
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
                        <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginTop: "4px" }}>
                          Request Ref: #{r.requestId} · Received on{" "}
                          {new Date(r.createdAt || Date.now()).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {/* Top Action Buttons */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {r.status !== "approved" && r.status !== "sent" && (
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(r)}
                            style={{
                              padding: "8px 14px",
                              background: "var(--forest)",
                              color: "var(--paper)",
                              borderRadius: "8px",
                              border: "none",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <i className="fa-solid fa-check"></i> Approve & Send
                          </button>
                        )}

                        <a
                          href={`mailto:${r.email}?subject=Your Requested Giftingwellness Catalogue: ${encodeURIComponent(catalogMeta.title)}&body=Dear ${encodeURIComponent(r.name)},%0D%0A%0D%0AThank you for your interest in Giftingwellness corporate gifting collections.%0D%0A%0D%0AYou can download the requested catalogue (${encodeURIComponent(catalogMeta.title)}) directly here:%0D%0Ahttps://giftingwellness.com/catalogues%0D%0A%0D%0APlease feel free to reply with your target quantities or event dates for tier discounts.%0D%0A%0D%0AWarm regards,%0D%0AGiftingwellness Corporate Team`}
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
                          <i className="fa-solid fa-envelope"></i> Email Link
                        </a>

                        {r.phone && (
                          <a
                            href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(r.name)},%20thank%20you%20for%20requesting%20the%20${encodeURIComponent(catalogMeta.title)}%20from%20Giftingwellness.%20Here%20is%20the%20direct%20catalogue%20PDF%20download%20link:%20https://giftingwellness.com/catalogues`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "8px 14px",
                              background: "#25d366",
                              color: "#fff",
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
                          onClick={() => handleOpenEdit(r)}
                          style={{
                            padding: "8px 14px",
                            background: "var(--ivory)",
                            color: "var(--ink)",
                            borderRadius: "8px",
                            border: "1px solid var(--line-strong)",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Update Status
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(r.requestId)}
                          title="Delete Request"
                          style={{
                            padding: "8px 10px",
                            background: "none",
                            border: "1px solid var(--line)",
                            color: "var(--muted)",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                      {/* Requested Catalogue Info */}
                      <div
                        style={{
                          background: "var(--ivory)",
                          padding: "14px",
                          borderRadius: "10px",
                          border: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "8px",
                            background: "var(--paper)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            color: catalogMeta.color || "var(--forest)",
                            border: "1px solid var(--line)",
                            flexShrink: 0,
                          }}
                        >
                          <i className={catalogMeta.icon || "fa-solid fa-file-pdf"}></i>
                        </div>
                        <div>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600" }}>
                            Requested Catalogue:
                          </span>
                          <h4 style={{ margin: "2px 0 4px", fontSize: "14px", fontWeight: "700", color: "var(--ink)" }}>
                            {catalogMeta.title}
                          </h4>
                          <span style={{ fontSize: "12px", color: "var(--forest)", fontWeight: "600" }}>
                            {catalogMeta.pages} · {catalogMeta.size}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "10px", border: "1px solid var(--line)" }}>
                        <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", fontWeight: "600" }}>
                          Contact Coordinates:
                        </span>
                        <p style={{ margin: "4px 0 2px", fontSize: "13px", color: "var(--ink)" }}>
                          <i className="fa-solid fa-envelope" style={{ marginRight: "6px", color: "var(--forest)" }}></i>
                          <strong>{r.email}</strong>
                        </p>
                        {r.phone && (
                          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: "6px", color: "var(--forest)" }}></i>
                            {r.phone}
                          </p>
                        )}
                        {r.company && (
                          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                            <i className="fa-solid fa-building" style={{ marginRight: "6px" }}></i>
                            {r.company}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Customer Message / Reason */}
                    {r.notes && (
                      <div
                        style={{
                          marginTop: "12px",
                          background: "var(--linen)",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "var(--ink)",
                          lineHeight: "1.5",
                        }}
                      >
                        <strong style={{ color: "var(--forest)" }}>Customer's Request Message:</strong> "{r.notes}"
                      </div>
                    )}

                    {/* Admin Staff Note */}
                    {r.adminNotes && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px 14px",
                          background: "var(--champagne-tint)",
                          border: "1px dashed #fef08a",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#713f12",
                        }}
                      >
                        <strong>Internal Admin Note:</strong> {r.adminNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Request Status Modal */}
          {editRequest && (
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
                    Update Catalogue Request · #{editRequest.requestId}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditRequest(null)}
                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--muted)" }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveStatus}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Request Status:
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    >
                      <option value="pending">Pending Review (New Request)</option>
                      <option value="in_review">In Review / Contacted</option>
                      <option value="approved">Approved & Sent Catalogue</option>
                      <option value="closed">Closed / Finished</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Internal Staff Notes / Tracking:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Sent corporate master PDF to user's work email and followed up on WhatsApp."
                      value={editForm.adminNotes}
                      onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "13px", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setEditRequest(null)}
                      style={{
                        padding: "10px 18px",
                        background: "var(--linen)",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      style={{
                        padding: "10px 20px",
                        background: "var(--forest)",
                        color: "var(--paper)",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: updating ? "not-allowed" : "pointer",
                      }}
                    >
                      {updating ? "Saving..." : "Save Changes"}
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

export default ManageCatalogueRequests;
