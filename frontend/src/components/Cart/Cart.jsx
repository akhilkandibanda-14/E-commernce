import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Path from "../Products/Path";
import QuantityControls from "../Products/Product/QuantityControls";
import { capitalize } from "../Helpers/Helpers";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../utils/format";

const Cart = ({ cart, decreaseQuantity, increaseQuantity, updateQuantity, removeFromCart, clearCart }) => {
  const { user, token, isLoggedIn, openAuthModal } = useAuth();

  const [promoInput, setPromoInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20); // Default 20% for demonstration
  const [promoApplied, setPromoApplied] = useState("SHOP20");
  const [promoError, setPromoError] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(15);

  // Enquiry modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("form"); // "form" | "processing" | "success"
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Idempotency key per logical session
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    company: "",
    address: "",
    city: "",
    postalCode: "",
    gstin: "",
    notes: "",
    isGift: false,
    recipientName: "",
    senderName: user?.name || "",
    giftMessage: "",
    giftWrap: false,
    hidePricingOnSlip: false,
  });

  // Pre-fill user information if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        senderName: prev.senderName || user.name || "",
      }));
    }
  }, [user]);

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  };

  const totalItemCount = cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const subtotal = calculateSubtotal();
  const effectiveDeliveryFee = subtotal > 0 ? deliveryFee : 0;
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const total = Math.max(0, subtotal - discountAmount + effectiveDeliveryFee);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscountPercent(Number(data.discountPercent) || 0);
        setDeliveryFee(data.freeShipping ? 0 : 15);
        setPromoApplied(data.code);
        setPromoInput("");
        return;
      }
      setPromoError(data.message || "Invalid coupon code.");
    } catch (err) {
      setPromoError("Failed to reach coupon validation service. Please try again.");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCheckout = () => {
    setCheckoutError("");
    setCheckoutStep("form");
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cart || cart.length === 0) {
      setCheckoutError("Your cart is empty. Please add items before submitting an enquiry.");
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setCheckoutError("Please enter your full name and email address.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutStep("processing");

    // Seamlessly support both authenticated users and guest visitors
    const targetUrl = token ? "/api/orders" : "/api/orders/enquiry";
    const headers = {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: {
            fullName: formData.fullName.trim(),
            email: (formData.email || user?.email || "").trim(),
            phone: formData.phone.trim(),
            company: formData.company.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            gstin: formData.gstin.trim(),
            notes: formData.notes.trim(),
          },
          notes: formData.notes.trim(),
          gifting: {
            isGift: Boolean(formData.isGift),
            recipientName: formData.recipientName.trim(),
            senderName: formData.senderName.trim(),
            giftMessage: formData.giftMessage.trim(),
            giftWrap: Boolean(formData.giftWrap),
            hidePricingOnSlip: Boolean(formData.hidePricingOnSlip),
          },
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            selectedColor: item.selectedColor,
            selectedBranding: item.selectedBranding,
            customLogoText: item.customLogoText,
          })),
          promoCode: promoApplied || null,
          paymentMethod: "order_enquiry (no online payment)",
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error(
          "Received an unexpected response from the server. Please check your connection and try again."
        );
      }

      if (!response.ok || !data?.success || !data?.order?.orderId) {
        const errorMsg =
          data?.message ||
          `Submission failed with status ${response.status}. Please check your details and try again.`;
        throw new Error(errorMsg);
      }

      setOrderData(data.order);
      setCheckoutStep("success");
      setIsCheckoutOpen(false);

      if (clearCart) {
        clearCart();
      }

      setIdempotencyKey(
        `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      );
    } catch (err) {
      setCheckoutError(
        err.message ||
          "Could not submit your order enquiry. Your items have been preserved. Please try again."
      );
      setCheckoutStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Path path={[{ route: "cart", link: "/cart" }]} />

      {cart.length > 0 ? (
        <main id="main-content" className="cart-page-container container">
          <h1 className="title--lg">Your bag</h1>
          <div className="cart-flex">
            {/* Products List */}
            <div className="cart-products-container">
              {cart.map((item) => (
                <div className="cart-product-container" key={item.idWithSize}>
                  <div className="cart-product-description">
                    <img
                      src={item.image || (item.images && item.images[0]) || "/casual.jpg"}
                      className="cart-product-img"
                      alt={item.title}
                      width="124"
                      height="124"
                    />
                    <div className="cart-item-details">
                      <h3 className="title--sm">{item.title}</h3>
                      <p className="text--marginless text--sm">
                        Size: <span className="text--gray">{capitalize(item.size || "M")}</span>
                      </p>
                      {item.selectedColor && (
                        <p className="text--marginless text--sm">
                          Color: <span className="text--gray">{item.selectedColor}</span>
                        </p>
                      )}
                      <p className="cart-product-price text--bold text--lg text--marginless">
                        {formatINR(Number(item.price))}
                      </p>
                    </div>
                  </div>

                  <div className="cart-product-buttons">
                    <button
                      className="btn-trash"
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.idWithSize || item)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                    <QuantityControls
                      amount={item.quantity}
                      decreaseQuantity={() => decreaseQuantity(item)}
                      increaseQuantity={() => increaseQuantity(item)}
                      onQuantityChange={(newQty) => updateQuantity && updateQuantity(item, newQty)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Enquiry Action */}
            <div className="cart-summary-container">
              <h2 className="title--sm">Order Summary</h2>

              {/* Total Number of Items Highlight Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ecfdf5",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid #a7f3d0",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#065f46" }}>
                  <i className="fa-solid fa-boxes-stacked" style={{ marginRight: "8px" }}></i>
                  Total Items / Quantity:
                </span>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#065f46" }}>
                  {totalItemCount} pcs
                </span>
              </div>

              <div className="cart-summary-text-container">
                <div className="cart-summary-text">
                  <p className="text--marginless text--gray">Distinct Products</p>
                  <p className="text--marginless text--bold">{cart.length}</p>
                </div>

                <div className="cart-summary-text">
                  <p className="text--marginless text--gray">Indicative Subtotal</p>
                  <p className="text--marginless text--bold">{formatINR(subtotal)}</p>
                </div>

                {discountAmount > 0 && (
                  <div className="cart-summary-text">
                    <p className="text--marginless text--gray">Estimated Discount (-{discountPercent}%)</p>
                    <p className="text--marginless text--bold text--red">
                      -{formatINR(discountAmount)}
                    </p>
                  </div>
                )}

                <div className="cart-summary-text">
                  <p className="text--marginless text--gray">Estimated Delivery</p>
                  <p className="text--marginless text--bold">
                    {effectiveDeliveryFee === 0 ? "FREE" : formatINR(effectiveDeliveryFee)}
                  </p>
                </div>

                <hr className="line" />

                <div className="cart-summary-text cart-total">
                  <p className="text--marginless text--bold">Estimated Total</p>
                  <p className="text--marginless text--bold text--lg">
                    {formatINR(total)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "var(--ivory)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "12px",
                  color: "var(--ink-soft)",
                  lineHeight: "1.5",
                  marginTop: "14px",
                  marginBottom: "14px",
                }}
              >
                <i className="fa-solid fa-shield-halved" style={{ color: "var(--forest)", marginRight: "6px" }}></i>
                <strong>Zero Online Payment:</strong> This submits an <strong>Order Enquiry</strong>. Our team will review stock, custom branding, and send an official invoice/quote.
              </div>

              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="promo-form">
                <div className="promo-input-container">
                  <i className="fa-solid fa-tag promo-icon"></i>
                  <input
                    type="text"
                    placeholder="Add promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="promo-input"
                  />
                </div>
                <button type="submit" className="btn-pill btn-black btn-promo">
                  Apply
                </button>
              </form>

              {promoApplied && (
                <p className="promo-success-text">
                  ✓ Promo <strong>{promoApplied}</strong> applied!
                </p>
              )}
              {promoError && <p className="promo-error-text">{promoError}</p>}

              <button
                onClick={handleOpenCheckout}
                className="btn-pill btn-black checkout-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span>Submit Order Enquiry ({totalItemCount} items)</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </main>
      ) : orderData && checkoutStep === "success" ? (
        /* Order Enquiry Confirmed View */
        <main className="cart-page-container container order-success-page">
          <div className="order-success-card">
            <div className="success-icon-badge" style={{ background: "#ecfdf5", color: "#059669", border: "2px solid #a7f3d0" }}>
              <i className="fa-solid fa-check"></i>
            </div>
            <h1 className="title--lg" style={{ color: "var(--forest)", marginTop: "12px" }}>
              ORDER ENQUIRY RECEIVED!
            </h1>
            <p className="order-subtitle" style={{ fontSize: "16px", fontWeight: "700" }}>
              Enquiry Reference: <strong>{orderData.orderId || orderData.orderNumber}</strong>
            </p>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "16px 20px",
                borderRadius: "10px",
                margin: "20px 0",
                color: "#166534",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: "20px", marginRight: "8px", verticalAlign: "middle" }}></i>
              An email notification has been dispatched to our sales & corporate gifting team with your request for <strong>{orderData.totalQuantity || orderData.items?.length || 0} items</strong>. An acknowledgement email was sent to <strong>{orderData.customer?.email}</strong>. Our team will contact you within 2 business hours with an official quote and delivery schedule.
            </div>

            <div className="order-items-receipt">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "15px" }}>Requested Products ({orderData.items?.length || 0})</h3>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--forest)" }}>
                  Total: {orderData.totalQuantity || orderData.items?.reduce((s, it) => s + (it.quantity || 1), 0)} Units
                </span>
              </div>

              {orderData.items?.map((it, idx) => (
                <div key={it.idWithSize || `${it.id}-${it.size || idx}`} className="receipt-row">
                  <span>
                    <strong>{it.quantity}x</strong> {it.title} ({String(it.size || "Standard").toUpperCase()})
                  </span>
                  <span>
                    {formatINR(Number(it.lineTotal || Number(it.price) * it.quantity))}
                  </span>
                </div>
              ))}
              <hr />
              <div className="receipt-row total">
                <span>Indicative Total</span>
                <span>
                  {formatINR(Number(orderData.pricing?.total ?? orderData.total ?? 0))}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "16px 0 24px" }}>
              Shipping address: {orderData.customer?.fullName}, {orderData.customer?.address}, {orderData.customer?.city} - {orderData.customer?.postalCode} · Phone: {orderData.customer?.phone || "N/A"}
            </p>

            <Link to="/products" className="btn-pill btn-black btn-return-shop">
              Browse More Catalogue Gifts
            </Link>
          </div>
        </main>
      ) : (
        /* Empty Cart State */
        <main id="main-content" className="cart-page-container container empty-cart-container">
          <div className="empty-cart-card">
            <i className="fa-solid fa-bag-shopping empty-cart-icon"></i>
            <h1 className="title--lg empty-cart-title">Your shopping bag is empty</h1>
            <p className="empty-cart-desc">
              Add gifts from the catalogue, specify the number of items needed, and submit an order enquiry.
            </p>
            <Link to="/products" className="btn-luxury btn-primary">
              Browse the catalogue
            </Link>
          </div>
        </main>
      )}

      {/* Order Enquiry Modal */}
      {isCheckoutOpen && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal-card" style={{ maxWidth: "680px" }}>
            <div className="checkout-modal-header">
              <h2 className="title--sm">
                <i className="fa-solid fa-clipboard-list" style={{ color: "var(--forest)", marginRight: "8px" }}></i>
                Submit Order Enquiry
              </h2>
              <button
                type="button"
                className="checkout-modal-close"
                onClick={() => {
                  if (!isSubmitting) {
                    setIsCheckoutOpen(false);
                    setCheckoutStep("form");
                  }
                }}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

            {/* Informational Banner */}
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "12px 16px",
                borderRadius: "8px",
                margin: "14px 0",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <i className="fa-solid fa-circle-info" style={{ color: "#059669", fontSize: "16px", marginTop: "2px" }}></i>
              <div style={{ fontSize: "13px", color: "#065f46", lineHeight: 1.5 }}>
                <strong>No payment is collected online.</strong> Review your requested item quantities and submit your contact details below. Our corporate gifting executive will email an official quotation with volume slab discounts.
              </div>
            </div>

            {/* Error Banner on submission/validation error */}
            {checkoutError && (
              <div className="checkout-error-banner" role="alert">
                <i className="fa-solid fa-circle-exclamation error-icon"></i>
                <div className="error-message-text">{checkoutError}</div>
              </div>
            )}

            {checkoutStep === "form" && (
              <form onSubmit={handlePlaceOrder} className="checkout-form">
                {/* Items & Number of items review box */}
                <div
                  style={{
                    background: "var(--ivory)",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    padding: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)" }}>
                      Items in this Enquiry ({cart.length} Products):
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--forest)" }}>
                      Total: {totalItemCount} Units
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
                    {cart.map((item) => (
                      <div
                        key={item.idWithSize}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          padding: "6px 0",
                          borderBottom: "1px dashed var(--line)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img
                            src={item.image || (item.images && item.images[0]) || "/casual.jpg"}
                            alt={item.title}
                            style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }}
                          />
                          <div>
                            <strong style={{ color: "var(--ink)" }}>{item.title}</strong>
                            <span style={{ color: "var(--muted)", marginLeft: "6px", fontSize: "12px" }}>
                              ({item.size || "Standard"})
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontWeight: "800",
                            color: "#065f46",
                            background: "#ecfdf5",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          {item.quantity} pcs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Contact and Shipping Fields */}
                <div className="checkout-fields-grid">
                  <div className="form-group full-width">
                    <label htmlFor="checkout-fullName">Full Name *</label>
                    <input
                      id="checkout-fullName"
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-email">Email Address (for quote delivery) *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      name="email"
                      required
                      placeholder="alex@company.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-phone">Contact Phone / WhatsApp *</label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="checkout-company">Company / Organization (Optional)</label>
                    <input
                      id="checkout-company"
                      type="text"
                      name="company"
                      placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                      value={formData.company}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="checkout-address">Delivery Address / Destination *</label>
                    <input
                      id="checkout-address"
                      type="text"
                      name="address"
                      required
                      placeholder="e.g. 100 Corporate Park, 4th Floor"
                      value={formData.address}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-city">City *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      name="city"
                      required
                      placeholder="e.g. Mumbai, Bengaluru, Delhi"
                      value={formData.city}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-postalCode">Postal Code (PIN) *</label>
                    <input
                      id="checkout-postalCode"
                      type="text"
                      name="postalCode"
                      required
                      placeholder="e.g. 560001"
                      value={formData.postalCode}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="checkout-gstin">GSTIN for Corporate B2B Invoicing (Optional)</label>
                    <input
                      id="checkout-gstin"
                      type="text"
                      name="gstin"
                      placeholder="e.g. 36AABCU9603R1ZM"
                      value={formData.gstin}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="checkout-notes">
                      Customization & Branding Instructions / Delivery Requirements (Optional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      name="notes"
                      rows={2}
                      placeholder="e.g. Please quote with laser-etched company logo on all units. Delivery needed by Nov 20th for our annual meet."
                      value={formData.notes}
                      onChange={handleFormChange}
                      disabled={isSubmitting}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                {/* Gifting & Personalization Card */}
                <div style={{ background: "var(--ivory)", border: "1px solid var(--line)", borderRadius: "10px", padding: "16px", margin: "16px 0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "var(--forest)", cursor: "pointer", fontSize: "14px" }}>
                    <input
                      type="checkbox"
                      name="isGift"
                      checked={formData.isGift}
                      onChange={(e) => setFormData({ ...formData, isGift: e.target.checked })}
                      disabled={isSubmitting}
                    />
                    <span>Include personalized gift note or packaging</span>
                  </label>

                  {formData.isGift && (
                    <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Recipient / Team Name</label>
                          <input
                            type="text"
                            name="recipientName"
                            placeholder="Recipient's Name"
                            value={formData.recipientName}
                            onChange={handleFormChange}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line-strong)", borderRadius: "6px", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Sender / Company Name</label>
                          <input
                            type="text"
                            name="senderName"
                            placeholder="Your Name"
                            value={formData.senderName}
                            onChange={handleFormChange}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line-strong)", borderRadius: "6px", fontSize: "13px" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Gift Message</label>
                        <textarea
                          name="giftMessage"
                          rows={2}
                          placeholder="e.g. Wishing you continued wellness, success, and joy!"
                          value={formData.giftMessage}
                          onChange={handleFormChange}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line-strong)", borderRadius: "6px", fontSize: "13px" }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink-soft)", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            name="giftWrap"
                            checked={formData.giftWrap}
                            onChange={(e) => setFormData({ ...formData, giftWrap: e.target.checked })}
                          />
                          <span>Add premium gift wrap presentation</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="checkout-summary-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Total Items to Quote: <strong>{totalItemCount} pcs</strong></span>
                  <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                    Indicative Total: <strong className="summary-total" style={{ color: "var(--forest)", marginLeft: "4px" }}>{formatINR(total)}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-pill btn-black btn-pay-now ${
                    isSubmitting ? "btn-submitting" : ""
                  }`}
                  style={{ marginTop: "16px" }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="button-spinner"></span>
                      Submitting Enquiry to Admin...
                    </>
                  ) : (
                    `Submit Order Enquiry (${totalItemCount} Items)`
                  )}
                </button>
              </form>
            )}

            {checkoutStep === "processing" && (
              <div className="checkout-processing-state">
                <div className="spinner"></div>
                <h3 className="title--sm">Submitting your order enquiry...</h3>
                <p className="text--gray">
                  Notifying the corporate sales team and preparing your confirmation receipt.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
