import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSiteContent } from "../../context/SiteContentContext";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { navigation, announcement } = useSiteContent();

  return (
    <header className="admin-header-wrapper">
      {/* Top Forest Green Announcement / Quick Bar matching customer theme */}
      <div className="admin-top-bar gifting-top-bar">
        <div className="container admin-top-bar-inner">
          <div className="admin-top-bar-left">
            <span className="announcement-badge-pill">
              <i className="fa-solid fa-gift"></i> {announcement?.badge?.replace(/^[^\w]+/, "") || "Corporate & Festive Gifting"} · Admin
            </span>
            <span className="admin-top-bar-text">
              Giftingwellness Admin Suite · Real-time Storefront & Navigation Synchronization
            </span>
          </div>

          <div className="admin-top-bar-right">
            <span className="admin-top-port-tag">
              <i className="fa-solid fa-server"></i> Port 5174 → API 5001
            </span>
            <span className="top-auth-pipe">|</span>
            <a
              href="http://localhost:5173"
              className="admin-top-storefront-link"
              target="_blank"
              rel="noreferrer"
              title="Open Customer Storefront on Port 5173"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Live Storefront (Port 5173)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Luxury Admin Navigation Bar */}
      <div className="admin-nav-bar">
        <div className="container admin-nav-content">
          <div className="admin-nav-left">
            <Link to="/admin" className="luxury-brand-wordmark gifting-logo" title="Giftingwellness Admin Suite">
              <img
                src="/giftingwellness-logo.png"
                alt="Giftingwellness Logo"
                className="brand-logo-img"
              />
              <div className="brand-logo-text-block">
                <span className="brand-logo-text">Giftingwellness</span>
                <span className="brand-logo-sub">
                  <span className="sub-dash">—</span> ADMIN PORTAL <span className="sub-dash">—</span>
                </span>
              </div>
            </Link>
          </div>

          <nav className="admin-nav-links">
            <Link
              to="/admin"
              className={`admin-nav-link ${location.pathname === "/admin" ? "active" : ""}`}
            >
              <i className="fa-solid fa-table-list"></i> Catalog
            </Link>
            <Link
              to="/admin/orders"
              className={`admin-nav-link ${location.pathname === "/admin/orders" ? "active" : ""}`}
            >
              <i className="fa-solid fa-boxes-packing"></i> Orders
            </Link>
            <Link
              to="/admin/quotes"
              className={`admin-nav-link ${location.pathname === "/admin/quotes" ? "active" : ""}`}
            >
              <i className="fa-solid fa-comments-dollar"></i> Quotes & Leads
            </Link>
            <Link
              to="/admin/users"
              className={`admin-nav-link ${location.pathname === "/admin/users" ? "active" : ""}`}
            >
              <i className="fa-solid fa-users"></i> Users & Visitors
            </Link>
            <Link
              to="/admin/add-product"
              className={`admin-nav-link ${location.pathname === "/admin/add-product" ? "active" : ""}`}
            >
              <i className="fa-solid fa-plus-circle"></i> Add Product
            </Link>
            <Link
              to="/admin/import"
              className={`admin-nav-link ${location.pathname === "/admin/import" ? "active" : ""}`}
            >
              <i className="fa-solid fa-file-import"></i> Bulk Import
            </Link>
            <Link
              to="/admin/site-content"
              className={`admin-nav-link ${location.pathname === "/admin/site-content" ? "active" : ""}`}
            >
              <i className="fa-solid fa-crown"></i> Content & CMS
            </Link>
          </nav>

          <div className="admin-nav-right">
            <div className="admin-user-pill">
              <span className="admin-avatar">
                <i className="fa-solid fa-user-shield"></i>
              </span>
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.name || "Admin"}</span>
                <span className="admin-user-role">Administrator</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-admin-logout"
              onClick={logout}
              title="Sign out of Admin session"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
