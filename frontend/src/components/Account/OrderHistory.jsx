import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const STATUS_MAP = {
  confirmed: { label: "Confirmed", bg: "var(--sage-tint)", color: "var(--success)", icon: "fa-circle-check" },
  in_production: { label: "In Production / Custom Branding", bg: "var(--champagne-tint)", color: "var(--warning)", icon: "fa-industry" },
  dispatched: { label: "Dispatched", bg: "#eff6ff", color: "#1e40af", icon: "fa-truck-fast" },
  delivered: { label: "Delivered", bg: "var(--sage-tint)", color: "var(--success)", icon: "fa-box-check" },
  cancelled: { label: "Cancelled", bg: "var(--danger-tint)", color: "var(--danger)", icon: "fa-circle-xmark" },
  pending: { label: "Pending", bg: "var(--champagne-tint)", color: "#854d0e", icon: "fa-clock" },
  pending_review: { label: "Pending Sales Review", bg: "var(--champagne-tint)", color: "#854d0e", icon: "fa-clock" },
  mockup_in_progress: { label: "Mockup in Progress", bg: "#eff6ff", color: "#1e40af", icon: "fa-wand-magic-sparkles" },
  quoted: { label: "Quotation Ready", bg: "var(--sage-tint)", color: "var(--success)", icon: "fa-file-invoice" },
  accepted: { label: "Quotation Accepted", bg: "var(--sage-tint)", color: "var(--success)", icon: "fa-check-double" },
};

const OrderHistory = () => {
  const { user, token, openAuthModal, isClerkEnabled, openClerkSignIn } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'quotes' | 'enquiries'
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, quotesRes, enquiriesRes] = await Promise.allSettled([
          fetch("/api/orders", { headers }),
          fetch("/api/quote/my-quotes", { headers }),
          fetch("/api/enquiries/my-enquiries", { headers }),
        ]);

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const data = await ordersRes.value.json();
          setOrders(data.orders || []);
        }

        if (quotesRes.status === "fulfilled" && quotesRes.value.ok) {
          const data = await quotesRes.value.json();
          setQuotes(data.quotes || []);
        }

        if (enquiriesRes.status === "fulfilled" && enquiriesRes.value.ok) {
          const data = await enquiriesRes.value.json();
          setEnquiries(data.enquiries || []);
        }
      } catch (err) {
        console.error("Failed to load customer account history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  if (!token) {
    return (
      <main className="container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", background: "var(--paper)", padding: "36px", borderRadius: "16px", border: "1px solid var(--line)", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <i className="fa-solid fa-lock fa-3x" style={{ color: "var(--forest)", marginBottom: "16px" }}></i>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--ink)", margin: "0 0 8px" }}>Sign In to View Your Account</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px" }}>
            Sign in with your Google or customer account to track orders, review corporate bulk quotes, and monitor custom branding mockups.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {isClerkEnabled ? (
              <button
                type="button"
                onClick={() => openClerkSignIn({ initialHint: "oauth_google" })}
                style={{
                  padding: "12px 24px",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "24px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <i className="fa-brands fa-google" style={{ color: "#4285F4" }}></i>
                Continue with Google
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openAuthModal("user")}
              style={{
                padding: "12px 28px",
                background: "var(--forest)",
                color: "var(--paper)",
                borderRadius: "24px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Sign In to My Account
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "40px 20px 80px", minHeight: "70vh" }}>
      {/* Breadcrumb / Title */}
      <div style={{ marginBottom: "28px" }}>
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
          <Link to="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link> / My Account / Dashboard
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--ink)", margin: "0 0 4px" }}>
              Account Activity & Orders
            </h1>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
              Signed in as <strong style={{ color: "var(--forest)" }}>{user?.email || user?.name}</strong>
              {user?.isClerk && <span style={{ marginLeft: "8px", background: "var(--sage-tint)", color: "var(--success)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>Verified Account</span>}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{ display: "flex", background: "var(--linen)", padding: "4px", borderRadius: "10px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                background: activeTab === "orders" ? "var(--forest)" : "transparent",
                color: activeTab === "orders" ? "var(--paper)" : "var(--ink-soft)",
                transition: "all 0.15s ease",
              }}
            >
              <i className="fa-solid fa-boxes-stacked" style={{ marginRight: "6px" }}></i>
              Orders ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("quotes")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                background: activeTab === "quotes" ? "var(--forest)" : "transparent",
                color: activeTab === "quotes" ? "var(--paper)" : "var(--ink-soft)",
                transition: "all 0.15s ease",
              }}
            >
              <i className="fa-solid fa-comments-dollar" style={{ marginRight: "6px" }}></i>
              Corporate Quotes ({quotes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("enquiries")}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                background: activeTab === "enquiries" ? "var(--forest)" : "transparent",
                color: activeTab === "enquiries" ? "var(--paper)" : "var(--ink-soft)",
                transition: "all 0.15s ease",
              }}
            >
              <i className="fa-solid fa-envelope-open-text" style={{ marginRight: "6px" }}></i>
              Enquiries ({enquiries.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: "var(--forest)" }}></i>
          <p style={{ marginTop: "12px", color: "var(--muted)" }}>Loading account records...</p>
        </div>
      ) : activeTab === "orders" ? (
        /* ORDERS TAB */
        orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--paper)", borderRadius: "16px", border: "1px solid var(--line)" }}>
            <i className="fa-solid fa-bag-shopping fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink)", margin: "0 0 8px" }}>No orders placed yet</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px" }}>
              Explore our curated corporate gift sets, executive bottles, and festive wellness hampers.
            </p>
            <Link
              to="/products"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "var(--forest)",
                color: "var(--paper)",
                borderRadius: "24px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Explore Gifting Catalog →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((ord) => {
              const statusInfo = STATUS_MAP[ord.status] || STATUS_MAP.confirmed;
              return (
                <div
                  key={ord.orderId}
                  style={{
                    background: "var(--paper)",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Order Top Bar */}
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--linen)", paddingBottom: "16px", marginBottom: "16px" }}>
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
                            padding: "4px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          <i className={`fa-solid ${statusInfo.icon}`}></i> {statusInfo.label}
                        </span>
                      </div>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Ordered on {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Paid</span>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--forest)" }}>
                        ₹{Number(ord.pricing?.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Ribbon if dispatched */}
                  {ord.tracking?.trackingNumber && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>
                          <i className="fa-solid fa-truck-fast" style={{ marginRight: "6px" }}></i>
                          Shipped via {ord.tracking.courier || "Courier Partner"}
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
                          Tracking / AWB Number: {ord.tracking.trackingNumber}
                        </p>
                      </div>
                      {ord.tracking.trackingUrl && (
                        <a
                          href={ord.tracking.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 14px",
                            background: "#1d4ed8",
                            color: "var(--paper)",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                            textDecoration: "none",
                          }}
                        >
                          Track Shipment Live →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ border: "1px solid var(--linen)", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                    {ord.items?.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderBottom: idx === ord.items.length - 1 ? "none" : "1px solid var(--line)",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.title}
                              style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
                            />
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "var(--ink)" }}>{it.title}</p>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                              Size: {it.size || "Standard"} {it.selectedColor ? `· Color: ${it.selectedColor}` : ""} {it.selectedBranding ? `· ${it.selectedBranding.toUpperCase()} Print` : ""}
                            </span>
                            {it.customLogoText && (
                              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--forest)", fontWeight: "600" }}>
                                Custom Branding: "{it.customLogoText}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Qty: {it.quantity}</span>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--forest)" }}>
                            ₹{Number(it.lineTotal || it.quantity * it.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Row: Delivery Address & Gifting Card */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", fontSize: "13px", color: "var(--ink-soft)" }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "var(--ink)" }}>Delivery Address:</span>
                      <p style={{ margin: "4px 0 0" }}>
                        {ord.customer?.fullName}<br />
                        {ord.customer?.address}, {ord.customer?.city} - {ord.customer?.postalCode}
                      </p>
                    </div>

                    {ord.gifting?.isGift && (
                      <div style={{ background: "var(--ivory)", padding: "10px 14px", borderRadius: "8px", border: "1px dashed var(--line-strong)" }}>
                        <span style={{ fontWeight: "700", color: "var(--forest)" }}>🎁 Gift Note:</span>
                        {ord.gifting?.recipientName && <p style={{ margin: "2px 0" }}>To: {ord.gifting.recipientName}</p>}
                        {ord.gifting?.giftMessage && <p style={{ margin: "2px 0", fontStyle: "italic" }}>"{ord.gifting.giftMessage}"</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === "quotes" ? (
        /* QUOTES TAB */
        quotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--paper)", borderRadius: "16px", border: "1px solid var(--line)" }}>
            <i className="fa-solid fa-comments-dollar fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink)", margin: "0 0 8px" }}>No bulk quotations requested yet</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px" }}>
              Request wholesale corporate pricing and free digital mockup samples on any product from our catalog.
            </p>
            <Link
              to="/products"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "var(--forest)",
                color: "var(--paper)",
                borderRadius: "24px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Request Corporate Quote →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {quotes.map((q) => {
              const statusInfo = STATUS_MAP[q.status] || STATUS_MAP.pending_review;
              return (
                <div
                  key={q.quoteId}
                  style={{
                    background: "var(--paper)",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    padding: "20px 24px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
                          {q.productTitle}
                        </h3>
                        <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                          <i className={`fa-solid ${statusInfo.icon}`}></i> {statusInfo.label}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Quote #{q.quoteId} · Submitted on {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Estimated Total</span>
                      <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--forest)" }}>
                        {q.estimatedTotal ? `₹${Number(q.estimatedTotal).toLocaleString("en-IN")}` : "Custom Quote"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", background: "var(--ivory)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "var(--ink-soft)" }}>
                    <div>
                      <strong>Quantity Requested:</strong> {q.quantity} units
                    </div>
                    <div>
                      <strong>Custom Branding:</strong> {q.brandingOption || "UV Digital Print"}
                    </div>
                    <div>
                      <strong>Company:</strong> {q.companyName}
                    </div>
                    <div>
                      <strong>Color:</strong> {q.selectedColor || "Default"}
                    </div>
                  </div>

                  {q.customText && (
                    <p style={{ margin: "10px 0 0", fontSize: "13px", color: "var(--forest)", fontWeight: "600" }}>
                      Branding Inscription: "{q.customText}"
                    </p>
                  )}

                  {q.adminNotes && (
                    <div style={{ marginTop: "12px", background: "var(--sage-tint)", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "var(--success)" }}>
                      <strong>Sales Team Note:</strong> {q.adminNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ENQUIRIES TAB */
        enquiries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--paper)", borderRadius: "16px", border: "1px solid var(--line)" }}>
            <i className="fa-solid fa-envelope-open-text fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink)", margin: "0 0 8px" }}>No general enquiries submitted yet</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px" }}>
              Looking for bespoke corporate gifting, custom curated sets, or festival lookbooks? Submit an enquiry.
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "var(--forest)",
                color: "var(--paper)",
                borderRadius: "24px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Return to Storefront →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {enquiries.map((enq) => (
              <div
                key={enq.enquiryId}
                style={{
                  background: "var(--paper)",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  padding: "20px 24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
                      Category: {enq.category}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Enquiry #{enq.enquiryId} · Submitted on {new Date(enq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <span style={{ background: "var(--sage-tint)", color: "var(--success)", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                    Status: {enq.status || "Pending"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", background: "var(--ivory)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "var(--ink-soft)" }}>
                  <div><strong>Quantity:</strong> {enq.quantity}</div>
                  <div><strong>Company:</strong> {enq.company || "Not specified"}</div>
                  <div><strong>Branding:</strong> {enq.customBranding}</div>
                  {enq.targetDate && <div><strong>Target Date:</strong> {enq.targetDate}</div>}
                </div>

                {enq.notes && (
                  <p style={{ margin: "10px 0 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                    <strong>Requirement Note:</strong> "{enq.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </main>
  );
};

export default OrderHistory;
