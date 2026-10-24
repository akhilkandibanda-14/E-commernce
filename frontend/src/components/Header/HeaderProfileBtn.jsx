import { useState, useRef, useEffect } from "react";
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { DEMO_LOGIN_ENABLED } from "../../utils/env";

const HeaderProfileBtn = ({ cart, handleMouseClick }) => {
  const {
    user,
    isAdmin,
    logout,
    openAuthModal,
    quickLogin,
    isClerkEnabled,
    openClerkSignIn,
    openUserProfile,
  } = useAuth();
  const { wishlistCount, openWishlist } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const calculateItemsNumber = () => {
    return cart.reduce((acc, item) => (acc += item.quantity), 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-btn-flex">
      <button
        className="btn-profile btn-search btn-search-mobile"
        onClick={handleMouseClick}
        aria-label="Search items"
      >
        <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "17px" }}></i>
      </button>

      <SearchBar />

      {/* Wishlist Icon */}
      <button
        type="button"
        onClick={openWishlist}
        className="btn-profile header-icon-btn card-item-count-container"
        aria-label="View Saved Items"
        title="Saved Items"
      >
        <i className="fa-regular fa-heart" style={{ fontSize: "18px" }}></i>
        {wishlistCount > 0 && (
          <span className="cart-item-count wishlist-item-count text--xxs">
            {wishlistCount}
          </span>
        )}
      </button>

      {/* Cart Icon */}
      <Link
        to="/cart"
        className="btn-profile header-icon-btn card-item-count-container"
        aria-label="View Shopping Bag"
        title="Shopping Bag"
      >
        <i className="fa-solid fa-bag-shopping" style={{ fontSize: "18px" }}></i>
        {cart.length > 0 && (
          <span className="cart-item-count text--xxs">
            {calculateItemsNumber()}
          </span>
        )}
      </Link>

      {/* Prominent Customer Login Button when not logged in */}
      {!user && (
        <button
          type="button"
          className="btn-header-customer-login"
          onClick={() => {
            if (isClerkEnabled) openClerkSignIn();
            else openAuthModal("user");
          }}
          title="Sign in as customer"
        >
          {isClerkEnabled ? (
            <i className="fa-brands fa-google" style={{ color: "#4285F4" }}></i>
          ) : (
            <i className="fa-regular fa-user"></i>
          )}
          <span className="customer-login-label">
            {isClerkEnabled ? "Sign In" : "Login"}
          </span>
        </button>
      )}

      {/* Profile / Account Area Dropdown */}
      <div className="profile-menu-container" ref={menuRef}>
        <button
          className={`btn-profile header-avatar-btn ${
            user ? "logged-in" : ""
          } ${isAdmin ? "is-admin" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={user ? `Account menu for ${user.name}` : "Account options"}
        >
          {user ? (
            user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="user-initials-badge">
                {isAdmin ? (
                  <i className="fa-solid fa-user-shield"></i>
                ) : (
                  getInitials(user.name)
                )}
              </span>
            )
          ) : (
            <span className="header-anon-icon" title="More login options">
              <img src="/profile.png" alt="profile menu" />
            </span>
          )}

          {user && (
            <span className="header-user-firstname">
              {isAdmin ? "Admin" : user.name.split(" ")[0]}
              <i className="fa-solid fa-chevron-down header-chevron-icon"></i>
            </span>
          )}

          {isAdmin && <span className="admin-status-dot" title="Admin Active"></span>}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="header-account-dropdown" role="menu">
            {user ? (
              // LOGGED IN VIEW
              <div className="dropdown-logged-in">
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar-circle">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : isAdmin ? (
                      <i className="fa-solid fa-shield-halved"></i>
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div className="dropdown-user-details">
                    <p className="dropdown-user-name">{user.name}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                    <span
                      className={`dropdown-role-pill ${
                        isAdmin ? "role-admin" : "role-customer"
                      }`}
                    >
                      {isAdmin ? "⭐ Store Administrator" : user.isClerk ? "✓ Verified Account" : "Customer Account"}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                {isAdmin && (
                  <div className="dropdown-admin-actions">
                    <Link
                      to="/admin"
                      className="dropdown-menu-item highlight-admin"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      title="Open Store Administration Suite"
                    >
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Admin Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="dropdown-menu-item highlight-action"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      title="Manage Store Orders & Fulfillment"
                    >
                      <i className="fa-solid fa-boxes-packing"></i>
                      <span>Fulfill Orders</span>
                    </Link>
                    <Link
                      to="/admin/quotes"
                      className="dropdown-menu-item highlight-action"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      title="Manage Corporate Bulk Quotations"
                    >
                      <i className="fa-solid fa-comments-dollar"></i>
                      <span>Quotes & Leads</span>
                    </Link>
                  </div>
                )}

                <div className="dropdown-common-actions">
                  <Link
                    to="/orders"
                    className="dropdown-menu-item"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <i className="fa-solid fa-boxes-stacked"></i>
                    <span>My Orders & Tracking</span>
                  </Link>

                  {user?.isClerk && (
                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        openUserProfile();
                        setMenuOpen(false);
                      }}
                      role="menuitem"
                      style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-user-gear"></i>
                      <span>Manage Google / Security Profile</span>
                    </button>
                  )}

                  <Link
                    to="/products"
                    className="dropdown-menu-item"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <i className="fa-solid fa-bag-shopping"></i>
                    <span>Browse Catalog</span>
                  </Link>

                  <Link
                    to="/cart"
                    className="dropdown-menu-item"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <i className="fa-solid fa-cart-shopping"></i>
                    <span>My Cart ({calculateItemsNumber()})</span>
                  </Link>
                </div>

                <div className="dropdown-divider"></div>

                <button
                  type="button"
                  className="dropdown-menu-item btn-dropdown-logout"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              // NOT LOGGED IN VIEW
              <div className="dropdown-anonymous">
                <div className="dropdown-anon-header">
                  <h4>Account Access</h4>
                  <p>Choose your login option below:</p>
                </div>

                <div className="dropdown-anon-buttons">
                  {isClerkEnabled && (
                    <button
                      type="button"
                      className="btn-dropdown-primary"
                      style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line-strong)" }}
                      onClick={() => {
                        openClerkSignIn({ initialHint: "oauth_google" });
                        setMenuOpen(false);
                      }}
                    >
                      <i className="fa-brands fa-google" style={{ color: "#4285F4" }}></i> Continue with Google
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-dropdown-primary"
                    onClick={() => {
                      if (isClerkEnabled) openClerkSignIn();
                      else openAuthModal("user");
                      setMenuOpen(false);
                    }}
                  >
                    <i className="fa-regular fa-user"></i> Customer Sign In
                  </button>
                </div>

                <div className="dropdown-divider"></div>

                {DEMO_LOGIN_ENABLED && (
                <div className="dropdown-quick-test">
                  <span className="quick-test-label">⚡ 1-Click Demo Login:</span>
                  <div className="quick-test-row">
                    <button
                      type="button"
                      className="btn-quick-pill pill-user"
                      onClick={() => {
                        quickLogin("user");
                        setMenuOpen(false);
                      }}
                      title="user@giftingwellness.com"
                    >
                      👤 Customer Demo
                    </button>
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderProfileBtn;