import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", bg: "var(--sage-tint)", color: "var(--success)", border: "#a7f3d0", icon: "fa-circle-check" },
  in_production: { label: "In Production", bg: "var(--champagne-tint)", color: "var(--warning)", border: "#fde68a", icon: "fa-industry" },
  dispatched: { label: "Dispatched", bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: "fa-truck-fast" },
  delivered: { label: "Delivered", bg: "var(--sage-tint)", color: "var(--success)", border: "#bbf7d0", icon: "fa-box-check" },
  cancelled: { label: "Cancelled", bg: "var(--danger-tint)", color: "var(--danger)", border: "#fecaca", icon: "fa-circle-xmark" },
  pending: { label: "Pending", bg: "var(--champagne-tint)", color: "#854d0e", border: "#fef08a", icon: "fa-clock" },
};

const ManageOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null); // for tracking/status edit modal
  const [statusForm, setStatusForm] = useState({
    status: "",
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
      console.error("Failed to load orders:", err);
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
      status: order.status || "confirmed",
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
        showToast(`Order #${activeOrder.orderId} updated to "${statusForm.status}"`);
        setActiveOrder(null);
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (err) {
      alert("Error updating order: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.phone?.includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate order stats
  const totalVolume = orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
  const activeFulfillmentCount = orders.filter((o) =>
    ["confirmed", "in_production", "pending"].includes(o.status)
  ).length;
  const dispatchedCount = orders.filter((o) => o.status === "dispatched").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Header Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-boxes-packing"></i> Order Fulfillment & Tracking
              </h1>
              <p className="admin-page-desc">
                Review placed orders, customer shipping details, corporate branding requirements, and courier dispatches.
              </p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="btn-admin-action"
                onClick={fetchOrders}
                title="Refresh live orders"
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
          <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Total Orders</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink)", margin: "6px 0 0" }}>{orders.length}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--warning)", textTransform: "uppercase", fontWeight: "600" }}>In Production / Pending</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--warning)", margin: "6px 0 0" }}>{activeFulfillmentCount}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: "600" }}>Dispatched</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "#1d4ed8", margin: "6px 0 0" }}>{dispatchedCount}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--success)", textTransform: "uppercase", fontWeight: "600" }}>Delivered</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--success)", margin: "6px 0 0" }}>{deliveredCount}</p>
            </div>
            <div className="admin-stat-card" style={{ background: "var(--paper)", padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>Gross Order Volume</span>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--forest)", margin: "6px 0 0" }}>₹{totalVolume.toFixed(2)}</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="admin-toolbar" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", background: "var(--paper)", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ flex: "1", minWidth: "260px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search by Order ID, customer, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid var(--line-strong)", borderRadius: "8px", fontSize: "14px" }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "14px", color: "var(--muted)" }}></i>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "confirmed", "in_production", "dispatched", "delivered", "cancelled"].map((st) => (
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
                  {st === "all" ? "All Orders" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: "var(--forest)" }}></i>
              <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
              <i className="fa-solid fa-box-open fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
              <h3 style={{ fontSize: "18px", color: "var(--ink)", margin: "0 0 6px" }}>No orders found</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>There are no orders matching your current search or filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredOrders.map((ord) => {
                const conf = STATUS_CONFIG[ord.status] || STATUS_CONFIG.confirmed;
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
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--ink)", margin: 0 }}>
                            Order #{ord.orderId}
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
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          Placed on {new Date(ord.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Amount</span>
                          <p style={{ fontSize: "20px", fontWeight: "800", color: "var(--forest)", margin: 0 }}>
                            ₹{Number(ord.pricing?.total || 0).toFixed(2)}
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
                          <i className="fa-solid fa-pen-to-square"></i> Update Status
                        </button>
                      </div>
                    </div>

                    {/* Order Content Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                      {/* Customer Details */}
                      <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                        <h4 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px" }}>
                          <i className="fa-solid fa-user-tag"></i> Customer & Shipping
                        </h4>
                        <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--ink)" }}>{ord.customer?.fullName}</p>
                        <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <i className="fa-solid fa-envelope" style={{ marginRight: "6px" }}></i>
                          {ord.customer?.email}
                        </p>
                        {ord.customer?.phone && (
                          <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--ink-soft)" }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: "6px" }}></i>
                            {ord.customer?.phone}
                          </p>
                        )}
                        {ord.customer?.company && (
                          <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--ink-soft)" }}>
                            <i className="fa-solid fa-building" style={{ marginRight: "6px" }}></i>
                            {ord.customer?.company}
                          </p>
                        )}
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <i className="fa-solid fa-location-dot" style={{ marginRight: "6px", color: "var(--forest)" }}></i>
                          {ord.customer?.address}, {ord.customer?.city} - {ord.customer?.postalCode}
                        </p>
                      </div>

                      {/* Gifting & Personalization Details */}
                      <div style={{ background: "var(--ivory)", padding: "14px", borderRadius: "8px" }}>
                        <h4 style={{ fontSize: "13px", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px" }}>
                          <i className="fa-solid fa-gift"></i> Gifting & Branding Info
                        </h4>
                        {ord.gifting?.isGift ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "var(--ink-soft)" }}>
                            <span style={{ fontWeight: "600", color: "var(--forest)" }}>🎁 Gift Order</span>
                            {ord.gifting?.recipientName && (
                              <p style={{ margin: 0 }}>To: <strong>{ord.gifting.recipientName}</strong></p>
                            )}
                            {ord.gifting?.senderName && (
                              <p style={{ margin: 0 }}>From: <strong>{ord.gifting.senderName}</strong></p>
                            )}
                            {ord.gifting?.giftMessage && (
                              <p style={{ margin: "4px 0", fontStyle: "italic", background: "var(--paper)", padding: "6px 10px", borderRadius: "6px", border: "1px dashed var(--line-strong)" }}>
                                "{ord.gifting.giftMessage}"
                              </p>
                            )}
                            {ord.gifting?.giftWrap && (
                              <span style={{ color: "var(--warning)", fontWeight: "600" }}>🎀 Premium Gift Wrap Requested</span>
                            )}
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Standard Direct Shipment</p>
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
                    <div style={{ marginTop: "14px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase" }}>Order Items ({ord.items?.length || 0}):</span>
                      <div style={{ marginTop: "8px", border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
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
                              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                                {it.quantity} × ₹{Number(it.price).toFixed(2)}
                              </span>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--forest)" }}>
                                ₹{Number(it.lineTotal || it.quantity * it.price).toFixed(2)}
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
                  maxWidth: "520px",
                  width: "100%",
                  padding: "24px",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--ink)" }}>
                    Update Fulfillment · Order #{activeOrder.orderId}
                  </h3>
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
                      Order Status:
                    </label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    >
                      <option value="confirmed">Confirmed (Paid / Approved)</option>
                      <option value="in_production">In Production / Branding</option>
                      <option value="dispatched">Dispatched (In Transit)</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Courier Partner Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhivery, BlueDart, Shiprocket, DTDC"
                      value={statusForm.courier}
                      onChange={(e) => setStatusForm({ ...statusForm, courier: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                      Tracking / Waybill Number (AWB):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DEL123456789"
                      value={statusForm.trackingNumber}
                      onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
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
                      {updating ? "Saving Changes..." : "Save Fulfillment Details"}
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
