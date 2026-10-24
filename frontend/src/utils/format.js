// Indian-rupee price formatting shared by cards, product pages and the cart.
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const formatINR = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${inr.format(n)}` : "";
};
