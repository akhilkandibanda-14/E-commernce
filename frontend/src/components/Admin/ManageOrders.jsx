import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";

const STATUS_CONFIG = {
  pending: { label: "Enquiry Received", bg: "var(--champagne-tint)", color: "#854d0e", border: "#fef08a", icon: "fa-clock" },
  quote_sent: { label: "Quote Sent", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "fa-envelope-open-text" },
  confirmed: { label: "Confirmed by Client", bg: "var(--sage-tint)", color: "var(--success)", border: "#a7f3d0", icon: "fa-circle-check" },
  in_production: { label: "In Production / Branding", bg: "var(--champagne-tint)", color: "var(--warning)", border: "#fde68a", icon: "fa-industry" },
  dispatched: { label: "Dispatched", bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: "fa-truck-fast" },
  delivered: { label: "Delivered", bg: "var(--sage-tint)", color: "var(--success)", border: "#bbf7d0", icon: "fa-box-check" },
  cancelled: { label: "Cancelled / Closed", bg: "var(--danger-tint)", color: "var(--danger)", border: "#fecaca", icon: "fa-circle-xmark" },
};

const ManageOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "",
    quoteAmount: "",
    adminNotes: "",
    courier: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(getAdminApiUrl("/api/orders"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load order enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const handleOpenEdit = (order) => {
    setActiveOrder(order);
    setStatusForm({
      status: order.status || "pending",
      quoteAmount: order.quoteAmount !== undefined ? String(order.quoteAmount) : "",
      adminNotes: order.adminNotes || "",
      courier: order.tracking?.courier || "",
      trackingNumber: order.tracking?.trackingNumber || "",
      trackingUrl: order.tracking?.trackingUrl || "",
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      setUpdating(true);
      const res = await fetch(getAdminApiUrl(`/api/orders/${activeOrder.orderId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusForm.status,
          quoteAmount: statusForm.quoteAmount ? Number(statusForm.quoteAmount) : undefined,
          adminNotes: statusForm.adminNotes.trim(),
          tracking: {
            courier: statusForm.courier.trim(),
            trackingNumber: statusForm.trackingNumber.trim(),
            trackingUrl: statusForm.trackingUrl.trim(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === activeOrder.orderId ? data.order : o))
        );
        showToast(`Order Enquiry #${activeOrder.orderId} updated to "${statusForm.status}"`);
        setActiveOrder(null);
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (err) {
      alert("Error updating order enquiry: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Helper to compute total items in an order
  const getOrderTotalItems = (ord) => {
    if (ord.totalQuantity) return Number(ord.totalQuantity);
    return (ord.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm.trim() === "" ||
      o.orderId?.toLowerCase().includes(q) ||
      o.customer?.fullName?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q) ||
      o.customer?.company?.toLowerCase().includes(q) ||
      o.customer?.phone?.includes(searchTerm) ||
      o.notes?.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === "all" || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalVolume = orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgressCount = orders.filter((o) =>
    ["quote_sent", "confirmed", "in_production"].includes(o.status)
  ).length;
  const dispatchedCount = orders.filter((o) => o.status === "dispatched").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const totalUnitsAll = orders.reduce((sum, o) => sum + getOrderTotalItems(o), 0);

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Header Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-clipboard-list"></i> Order Enquiries & Quotations
              </h1>
              <p className="admin-page-desc">
                Review incoming client order enquiries, requested item quantities, shipping details, and issue official corporate proposals.
              </p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="btn-admin-action"
                onClick={fetchOrders}
                title="Refresh live enquiries"
              >
                <i className="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>
          </div>

          {toast && (
            <div className={`admin-action-banner ${toast.type}`}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{toast.message}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Total Enquiries</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink)", margin: "6px 0 0" }}>{orders.length}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "#854d0e", textTransform: "uppercase", fontWeight: "600" }}>Pending Review</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "#854d0e", margin: "6px 0 0" }}>{pendingCount}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--forest)", textTransform: "uppercase", fontWeight: "700" }}>Total Items Requested</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--forest)", margin: "6px 0 0" }}>{totalUnitsAll} pcs</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: "600" }}>In Progress / Quoted</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "#1d4ed8", margin: "6px 0 0" }}>{inProgressCount}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Indicative Value</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--forest)", margin: "6px 0 0" }}>₹{totalVolume.toFixed(2)}</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="admin-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", background: "var(--paper)", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ flex: "1", minWidth: "260px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search by Enquiry ID, customer, email, phone, company, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid var(--line-strong)", borderRadius: "8px", fontSize: "14px" }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "14px", color: "var(--muted)" }}></i>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "pending", "quote_sent", "confirmed", "in_production", "dispatched", "delivered", "cancelled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: selectedStatus === st ? "var(--forest)" : "var(--line)",
                    background: selectedStatus === st ? "var(--forest)" : "var(--ivory)",
                    color: selectedStatus === st ? "var(--paper)" : "var(--ink-soft)",
                    fontWeight: selectedStatus === st ? "600" : "500",
                    fontSize: "13px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {st === "all" ? "All Enquiries" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: "var(--forest)" }}></i>
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading order enquiries...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
              <i className="fa-solid fa-clipboard-question fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
              <h3 style={{ fontSize: "18px", color: "var(--ink)", margin: "0 0 6px" }}>No order enquiries found</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>There are no enquiries matching your current search or filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredOrders.map((ord) => {
                const conf = STATUS_CONFIG[ord.status] || STATUS_CONFIG.pending;
                const totalUnits = getOrderTotalItems(ord);
                const rawPhone = ord.customer?.phone ? ord.customer.phone.replace(/[^\d+]/g, "") : "";
                const cleanPhone = rawPhone.startsWith("+") ? rawPhone.slice(1) : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);

                return (
                  <div
                    key={ord.orderId}
                    style={{
                      background: "var(--paper)",
                      borderRadius: "12px",
                      border: "1px solid var(--line)",
                      padding: "20px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Order Top Bar */}
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--linen)", paddingBottom: "14px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", margin: 0 }}>
                            Enquiry #{ord.orderId}
                          </h2>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "16px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: conf.bg,
                              color: conf.color,
                              border: `1px solid ${conf.border}`,
                            }}
                          >
                            <i className={`fa-solid ${conf.icon}`}></i> {conf.label}
                          </span>

                          {/* PROMINENT TOTAL ITEMS COUNT BADGE */}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "16px",
                              fontSize: "13px",
                              fontWeight: "800",
                              background: "#ecfdf5",
                              color: "#065f46",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            <i className="fa-solid fa-boxes-stacked"></i> {totalUnits} Items Requested
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginTop: "4px" }}>
                          Submitted on {new Date(ord.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {ord.quoteAmount ? "Official Quoted Price" : "Indicative Total"}
                          </span>
                          <p style={{ fontSize: "20px", fontWeight: "800", color: "var(--forest)", margin: 0 }}>
                            ₹{Number(ord.quoteAmount || ord.pricing?.total || 0).toFixed(2)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ord)}
                          style={{
                            padding: "8px 16px",
                            background: "var(--forest)",
                            color: "var(--paper)",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Update Status & Quote
                        </button>
                      </div>
                    </div>

                    {/* Order Content Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                      {/* Customer Details */}
                      <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <h4 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
                            <i className="fa-solid fa-user-tag"></i> Customer & Contact Details
                          </h4>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--forest)", background: "var(--paper)", padding: "2px 6px", borderRadius: "4px" }}>
                            No Online Payment
                          </span>
                        </div>

                        <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--ink)", fontSize: "15px" }}>{ord.customer?.fullName}</p>
                        
                        {ord.customer?.company && (
                          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "600", color: "var(--forest)" }}>
                            <i className="fa-solid fa-building" style={{ marginRight: "6px" }}></i>
                            {ord.customer?.company}
                            {ord.customer?.gstin && <span style={{ marginLeft: "8px", color: "var(--muted)", fontWeight: "normal" }}>· GST: {ord.customer.gstin}</span>}
                          </p>
                        )}

                        <p style={{ margin: "0 0 6px", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <i className="fa-solid fa-envelope" style={{ marginRight: "6px" }}></i>
                          <a href={`mailto:${ord.customer?.email}`} style={{ color: "var(--forest)", textDecoration: "underline" }}>
                            {ord.customer?.email}
                          </a>
                        </p>

                        {ord.customer?.phone && (
                          <div style={{ margin: "0 0 8px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span>
                              <i className="fa-solid fa-phone" style={{ marginRight: "6px" }}></i>
                              <a href={`tel:${ord.customer.phone}`} style={{ color: "var(--forest)", fontWeight: "600" }}>
                                {ord.customer.phone}
                              </a>
                            </span>

                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(ord.customer?.fullName || "")},%20this%20is%20Giftingwellness%20regarding%20your%20Order%20Enquiry%20%23${encodeURIComponent(ord.orderId)}%20for%20${totalUnits}%20items.`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#25D366",
                                  color: "#ffffff",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  textDecoration: "none",
                                }}
                              >
                                <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                              </a>
                            )}
                          </div>
                        )}

                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                          <i className="fa-solid fa-location-dot" style={{ marginRight: "6px", color: "var(--forest)" }}></i>
                          {ord.customer?.address}, {ord.customer?.city} - {ord.customer?.postalCode}
                        </p>
                      </div>

                      {/* Gifting & Custom Notes */}
                      <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h4 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px" }}>
                            <i className="fa-solid fa-comment-dots"></i> Client Instructions & Notes
                          </h4>
                          
                          {(ord.notes || ord.customer?.notes) ? (
                            <div style={{ background: "#fffbeb", border: "1px dashed #fde68a", padding: "10px 12px", borderRadius: "6px", color: "#92400e", fontSize: "13px", fontStyle: "italic", marginBottom: "8px" }}>
                              "{ord.notes || ord.customer.notes}"
                            </div>
                          ) : (
                            <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic", margin: "0 0 8px" }}>
                              No special customization notes provided.
                            </p>
                          )}

                          {ord.gifting?.isGift && (
                            <div style={{ fontSize: "12px", color: "var(--forest)", fontWeight: "600", marginTop: "4px" }}>
                              🎁 Marked as Gift {ord.gifting.giftWrap ? "· Gift Wrap Requested" : ""}
                              {ord.gifting.giftMessage && <p style={{ margin: "2px 0 0", fontStyle: "italic", color: "var(--ink-soft)" }}>Note: "{ord.gifting.giftMessage}"</p>}
                            </div>
                          )}
                        </div>

                        {/* Admin Internal Quotation / Status Notes */}
                        {(ord.adminNotes || ord.quoteAmount) && (
                          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "6px", marginTop: "8px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase" }}>Admin Follow-up Note:</span>
                            {ord.quoteAmount && (
                              <p style={{ margin: "2px 0", fontSize: "12px", fontWeight: "700", color: "#1e40af" }}>
                                Quoted Amount: ₹{Number(ord.quoteAmount).toFixed(2)}
                              </p>
                            )}
                            {ord.adminNotes && (
                              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#1e3a8a" }}>{ord.adminNotes}</p>
                            )}
                          </div>
                        )}

                        {/* Courier Tracking snippet */}
                        {ord.tracking?.trackingNumber && (
                          <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--line)" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>Tracking Dispatched:</span>
                            <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                              {ord.tracking.courier}: {ord.tracking.trackingNumber}
                            </p>
                            {ord.tracking.trackingUrl && (
                              <a
                                href={ord.tracking.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline" }}
                              >
                                View Tracking Portal →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink)", textTransform: "uppercase" }}>
                          Enquiry Products Breakdown ({ord.items?.length || 0} Distinct Products):
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--forest)" }}>
                          Total: {totalUnits} Units
                        </span>
                      </div>

                      <div style={{ border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
                        {ord.items?.map((it, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              borderBottom: idx === ord.items.length - 1 ? "none" : "1px solid var(--line)",
                              gap: "12px",
                              background: idx % 2 === 0 ? "var(--paper)" : "var(--ivory)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.title}
                                  style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "6px" }}
                                />
                              )}
                              <div>
                                <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "var(--ink)" }}>{it.title}</p>
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                  Size: {it.size || "Standard"} {it.selectedColor ? `· Color: ${it.selectedColor}` : ""} {it.selectedBranding ? `· Branding: ${it.selectedBranding.toUpperCase()}` : ""}
                                </span>
                                {it.customLogoText && (
                                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--forest)", fontWeight: "600" }}>
                                    Logo Name to Print: "{it.customLogoText}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  background: "#ecfdf5",
                                  color: "#065f46",
                                  fontWeight: "800",
                                  fontSize: "14px",
                                  border: "1px solid #a7f3d0",
                                }}
                              >
                                {it.quantity} pcs
                              </span>
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                @ ₹{Number(it.price).toFixed(2)} = ₹{Number(it.lineTotal || it.quantity * it.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Order Status & Tracking Modal */}
          {activeOrder && (
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
                  maxWidth: "540px",
                  width: "100%",
                  padding: "24px",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--ink)" }}>
                      Manage Order Enquiry #{activeOrder.orderId}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                      Customer: {activeOrder.customer?.fullName} ({getOrderTotalItems(activeOrder)} Total Units)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--muted)" }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateStatus}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Enquiry Status:
                    </label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    >
                      <option value="pending">Enquiry Received (Pending Review)</option>
                      <option value="quote_sent">Quote / Proposal Sent to Client</option>
                      <option value="confirmed">Confirmed by Client</option>
                      <option value="in_production">In Production / Custom Branding</option>
                      <option value="dispatched">Dispatched (In Transit)</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled / Closed</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                        Quoted Price (₹ Optional):
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 45000"
                        value={statusForm.quoteAmount}
                        onChange={(e) => setStatusForm({ ...statusForm, quoteAmount: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                        Courier Partner:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BlueDart, Delhivery"
                        value={statusForm.courier}
                        onChange={(e) => setStatusForm({ ...statusForm, courier: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Tracking / Waybill (AWB #):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DEL123456789"
                      value={statusForm.trackingNumber}
                      onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Courier Tracking URL:
                    </label>
                    <input
                      type="url"
                      placeholder="https://track.shiprocket.in/..."
                      value={statusForm.trackingUrl}
                      onChange={(e) => setStatusForm({ ...statusForm, trackingUrl: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Admin Internal Follow-up Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Sent formal quotation on email with 15% corporate discount. Client approved mockup."
                      value={statusForm.adminNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--ivory)", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--forest)", color: "var(--paper)", fontWeight: "600", cursor: "pointer" }}
                    >
                      {updating ? "Saving Changes..." : "Save Enquiry Details"}
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

export default ManageOrders;
