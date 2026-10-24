import { useState, useEffect, useRef } from "react";
import {
  Route,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Outlet,
  ScrollRestoration,
  Link,
  useLocation,
} from "react-router-dom";
import "./index.css";
import Home from "./components/Home/Home";
import Products from "./components/Products/Products";
import Product from "./components/Products/Product/Product";
import PageNotFound from "./components/Misc/PageNotFound";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Cart from "./components/Cart/Cart";
import UnderConstruction from "./components/Misc/UnderConstruction";
import AuthModal from "./components/Auth/AuthModal";
import LoginPage from "./components/Auth/LoginPage";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AddProduct from "./components/Admin/AddProduct";
import AdminImport from "./components/Admin/AdminImport";
import AdminPortNotice from "./components/Admin/AdminPortNotice";
import ManageSiteContent from "./components/Admin/ManageSiteContent";
import ManageOrders from "./components/Admin/ManageOrders";
import ManageEnquiries from "./components/Admin/ManageEnquiries";
import OrderHistory from "./components/Account/OrderHistory";
import { WishlistProvider } from "./context/WishlistContext";
import { SiteContentProvider } from "./context/SiteContentContext";
import WishlistDrawer from "./components/Wishlist/WishlistDrawer";
import AboutUs from "./components/About/AboutUs";
import LegalPolicyPage from "./components/Misc/LegalPolicyPage";

function App() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const toastTimer = useRef(null);

  const [toast, setToast] = useState({ visible: false, message: "", title: "" });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const showNotification = (title, message) => {
    setToast({ visible: true, title, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast({ visible: false, title: "", message: "" });
    }, 3500);
  };

  // All cart updates are functional and immutable so rapid clicks never read a stale cart.
  const addToCart = (item, quantity, size) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const itemIdWithSize = `${item.id}-${size}`;

    setCart((prev) => {
      const exists = prev.some((cartItem) => cartItem.idWithSize === itemIdWithSize);
      if (exists) {
        return prev.map((cartItem) =>
          cartItem.idWithSize === itemIdWithSize
            ? { ...cartItem, quantity: cartItem.quantity + qty }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: qty, size, idWithSize: itemIdWithSize }];
    });

    const sizeNote = size && size !== "Standard" ? ` · Size ${size}` : "";
    showNotification("Added to bag", `${qty} × ${item.title}${sizeNote}`);
  };

  const changeQuantity = (item, delta) => {
    const itemIdWithSize = `${item.id}-${item.size}`;
    setCart((prev) =>
      prev.map((cartItem) =>
        cartItem.idWithSize === itemIdWithSize
          ? { ...cartItem, quantity: Math.max(1, cartItem.quantity + delta) }
          : cartItem
      )
    );
  };

  const decreaseQuantity = (item) => changeQuantity(item, -1);

  const increaseQuantity = (item) => changeQuantity(item, 1);

  const removeFromCart = (itemIdWithSize) => {
    setCart((prev) => prev.filter((item) => item.idWithSize !== itemIdWithSize));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Detect whether frontend is running on the dedicated Admin Port (5174)
  const isPortalAdmin =
    (typeof window !== "undefined" && window.location.port === "5174") ||
    import.meta.env.VITE_PORTAL_TYPE === "admin";

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={
          <Root
            cart={cart}
            removeFromCart={removeFromCart}
            toast={toast}
            setToast={setToast}
            isPortalAdmin={isPortalAdmin}
          />
        }
      >
        {isPortalAdmin ? (
          // ==================== PORT 5174: ADMIN MANAGEMENT PORTAL ====================
          <>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<ManageOrders />} />
            <Route path="/admin/quotes" element={<ManageEnquiries />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/site-content" element={<ManageSiteContent />} />
            <Route path="/products" element={<Products />}>
              <Route path=":category" element={<Products />} />
            </Route>
            <Route path="/products/:category/:id" element={<Product addToCart={addToCart} />} />
            <Route path="*" element={<AdminDashboard />} />
          </>
        ) : (
          // ==================== PORT 5173: CUSTOMER STOREFRONT & DIRECT ADMIN ACCESS ====================
          <>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/products" element={<Products />}>
              <Route path=":category" element={<Products />} />
            </Route>
            <Route
              path="/products/:category/:id"
              element={<Product addToCart={addToCart} />}
            />
            <Route
              path="/cart"
              element={
                <Cart
                  cart={cart}
                  decreaseQuantity={decreaseQuantity}
                  increaseQuantity={increaseQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                />
              }
            />
            <Route path="/login" element={<LoginPage />} />
            {/* Unified Direct Admin Management Routes (Protected by AdminRoute) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<ManageOrders />} />
            <Route path="/admin/quotes" element={<ManageEnquiries />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/site-content" element={<ManageSiteContent />} />
            <Route path="/terms" element={<LegalPolicyPage />} />
            <Route path="/refund-policy" element={<LegalPolicyPage />} />
            <Route path="/shipping-policy" element={<LegalPolicyPage />} />
            <Route path="/privacy" element={<LegalPolicyPage />} />
            <Route path="/underconstruction" element={<UnderConstruction />} />
            <Route path="*" element={<PageNotFound />} />
          </>
        )}
      </Route>
    )
  );

  return (
    <SiteContentProvider>
      <WishlistProvider onAddToCart={addToCart}>
        <RouterProvider router={router} />
      </WishlistProvider>
    </SiteContentProvider>
  );
}

function Root({ cart, removeFromCart, toast, setToast, isPortalAdmin }) {
  const location = useLocation();
  const isAdminRoute = isPortalAdmin || location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header cart={cart} removeFromCart={removeFromCart} />}
      <ScrollRestoration />
      <Outlet />
      {!isAdminRoute && <Footer />}

      {/* Slide-over Wishlist Drawer */}
      <WishlistDrawer />

      {/* Global Auth Modal accessible from any page */}
      <AuthModal />

      {/* Floating Add to Cart Toast */}
      {toast.visible && (
        <aside aria-label="Notification" className="cart-toast-banner" role="status">
          <div className="cart-toast-content">
            <div className="toast-icon" aria-hidden="true">
              <i className="fa-solid fa-bag-shopping"></i>
            </div>
            <div className="toast-text">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-sub">{toast.message}</p>
            </div>
          </div>
          <div className="toast-actions">
            <Link
              to="/cart"
              className="toast-cart-link"
              onClick={() => setToast({ visible: false, title: "", message: "" })}
            >
              View bag
            </Link>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast({ visible: false, title: "", message: "" })}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

export default App;
