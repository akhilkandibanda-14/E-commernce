import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    selectedColor: { type: String },
    selectedBranding: { type: String },
    customLogoText: { type: String },
    logoUrl: { type: String },
    image: { type: String },
    category: { type: String },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    user: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "quote_sent", "confirmed", "in_production", "dispatched", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    orderType: { type: String, default: "order_enquiry" },
    totalQuantity: { type: Number, default: 1 },
    notes: { type: String, default: "" },
    estimatedDelivery: { type: String },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      company: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      gstin: { type: String },
      notes: { type: String },
    },
    items: [orderItemSchema],
    gifting: {
      isGift: { type: Boolean, default: false },
      senderName: { type: String },
      recipientName: { type: String },
      giftMessage: { type: String },
      giftWrap: { type: Boolean, default: false },
      giftWrapType: { type: String },
      hidePricingOnSlip: { type: Boolean, default: false },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      taxGst: { type: Number, default: 0 },
      total: { type: Number, required: true },
      promoCode: { type: String, default: null },
    },
    paymentMethod: { type: String, default: "card" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    tracking: {
      courier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      dispatchedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
