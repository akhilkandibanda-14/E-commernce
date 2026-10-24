import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DEMO_LOGIN_ENABLED } from "../../utils/env";

const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    quickLogin,
    loading,
    isClerkEnabled,
    openClerkSignIn,
    openClerkSignUp,
  } = useAuth();

  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isAuthModalOpen) return null;

  const handleTabChange = (tab) => {
    setAuthModalTab(tab);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (authModalTab === "register") {
      if (!name.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        setErrorMsg("Please enter your email address.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }

      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMsg(res.message || "Registration failed.");
      } else {
        setSuccessMsg("Welcome! Your account has been created.");
        setTimeout(() => {
          closeAuthModal();
        }, 1200);
      }
    } else {
      // User or Admin Login
      if (!email.trim() || !password) {
        setErrorMsg("Please enter both email and password.");
        return;
      }

      const roleHint = authModalTab === "admin" ? "admin" : null;
      const res = await login(email, password, roleHint);

      if (!res.success) {
        setErrorMsg(res.message || "Authentication failed.");
      } else {
        setSuccessMsg(
          authModalTab === "admin"
            ? "Admin authenticated! Redirecting to dashboard..."
            : "Signed in successfully!"
        );
        setTimeout(() => {
          closeAuthModal();
          if (authModalTab === "admin") {
            navigate("/admin");
          }
        }, 1000);
      }
    }
  };

  const handleQuickDemo = async (role) => {
    setErrorMsg("");
    setSuccessMsg("");
    const res = await quickLogin(role);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(
        role === "admin"
          ? "Admin access granted! Entering dashboard..."
          : "Signed in as demo customer!"
      );
      setTimeout(() => {
        closeAuthModal();
        if (role === "admin") {
          navigate("/admin");
        }
      }, 900);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={closeAuthModal}>
      <div
        className={`auth-modal-card ${authModalTab === "admin" ? "admin-mode" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close authentication window"
        >
          ✕
        </button>

        {/* Modal Header Tabs */}
        <div className="auth-tabs-nav">
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === "user" ? "active" : ""}`}
            onClick={() => handleTabChange("user")}
          >
            <i className="fa-regular fa-user"></i> Customer Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn admin-tab ${authModalTab === "admin" ? "active" : ""}`}
            onClick={() => handleTabChange("admin")}
          >
            <i className="fa-solid fa-shield-halved"></i> Admin Portal
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authModalTab === "register" ? "active" : ""}`}
            onClick={() => handleTabChange("register")}
          >
            <i className="fa-solid fa-user-plus"></i> Create Account
          </button>
        </div>

        {/* Quick Demo Login Callout */}
        {DEMO_LOGIN_ENABLED && authModalTab === "user" && (
          <div className="demo-callout customer-demo">
            <div className="demo-callout-info">
              <span className="demo-pill">Quick Demo</span>
              <p>Instant access with sample customer account</p>
            </div>
            <button
              type="button"
              className="btn-quick-demo"
              onClick={() => handleQuickDemo("user")}
              disabled={loading}
            >
              1-Click Customer Login →
            </button>
          </div>
        )}

        {/* Google & Clerk One-Click Sign In */}
        {(authModalTab === "user" || authModalTab === "register") && (
          <div style={{ margin: "14px 0 10px" }}>
            {isClerkEnabled ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => openClerkSignIn({ initialHint: "oauth_google" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px 18px",
                    background: "var(--paper)",
                    border: "1px solid var(--line-strong)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--ink)",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google (Clerk 1-Click)</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", margin: "4px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
                  <span style={{ padding: "0 10px", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "600" }}>or with account email</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--ivory)", border: "1px dashed var(--line-strong)", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <i className="fa-brands fa-google" style={{ color: "#4285F4", fontSize: "15px" }}></i>
                <span>Google & Clerk Login Ready: Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>frontend/.env</code> to activate.</span>
              </div>
            )}
          </div>
        )}

        {DEMO_LOGIN_ENABLED && authModalTab === "admin" && (
          <div className="demo-callout admin-demo">
            <div className="demo-callout-info">
              <span className="demo-pill admin-pill">Admin Access</span>
              <p>Sign in as store manager to add & edit products</p>
            </div>
            <button
              type="button"
              className="btn-quick-demo btn-admin-demo"
              onClick={() => handleQuickDemo("admin")}
              disabled={loading}
            >
              ⚡ 1-Click Admin Login →
            </button>
          </div>
        )}

        {/* Title & Description */}
        <div className="auth-header-copy">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <img
              src="/giftingwellness-logo.png"
              alt="Giftingwellness Logo"
              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "contain", background: "var(--paper)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            />
          </div>
          <h2 id="auth-modal-title" className="auth-title">
            {authModalTab === "admin"
              ? "Store Administrator Portal"
              : authModalTab === "register"
              ? "Create Corporate Account"
              : "Welcome to Giftingwellness"}
          </h2>
          <p className="auth-subtitle">
            {authModalTab === "admin"
              ? "Authorized store management area. Manage inventory and add new products."
              : authModalTab === "register"
              ? "Join to track your bulk orders, download catalogues, and receive VIP corporate rates."
              : "Corporate Gifting Solutions. Sign in to access your cart, order history, and exclusive discounts."}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="auth-alert error-alert" role="alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success-alert" role="status">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {authModalTab === "register" && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <div className="input-with-icon">
                <i className="fa-regular fa-id-badge input-icon"></i>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">
              {authModalTab === "admin" ? "Admin Email Address" : "Email Address"}
            </label>
            <div className="input-with-icon">
              <i className="fa-regular fa-envelope input-icon"></i>
              <input
                id="auth-email"
                type="email"
                placeholder={
                  authModalTab === "admin" ? "admin@giftingwellness.com" : "your.email@example.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="auth-password">Password</label>
              {authModalTab !== "register" && (
                <button
                  type="button"
                  className="btn-forgot-password"
                  onClick={() =>
                    setErrorMsg("Please use the demo account button above for instant testing.")
                  }
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="input-with-icon">
              <i className="fa-solid fa-lock input-icon"></i>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={authModalTab === "register" ? "new-password" : "current-password"}
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          {authModalTab === "register" && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <i className="fa-solid fa-lock input-icon"></i>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          {DEMO_LOGIN_ENABLED && authModalTab === "admin" && (
            <div className="admin-hint-box">
              <i className="fa-solid fa-key"></i>
              <span>Default Credentials: <strong>admin@giftingwellness.com</strong> / <strong>admin123</strong></span>
            </div>
          )}

          {DEMO_LOGIN_ENABLED && authModalTab === "user" && (
            <div className="customer-hint-box">
              <i className="fa-solid fa-user-tag"></i>
              <span>Default Credentials: <strong>user@giftingwellness.com</strong> / <strong>user123</strong></span>
            </div>
          )}

          <button
            type="submit"
            className={`btn-auth-submit ${authModalTab === "admin" ? "btn-admin-submit" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-inline">
                <i className="fa-solid fa-circle-notch fa-spin"></i> Authenticating...
              </span>
            ) : authModalTab === "admin" ? (
              "Sign In to Admin Dashboard →"
            ) : authModalTab === "register" ? (
              "Complete Registration"
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="auth-modal-footer">
          {authModalTab === "register" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => handleTabChange("user")}
              >
                Sign In here
              </button>
            </p>
          ) : authModalTab === "admin" ? (
            <p>
              Looking for consumer shopping?{" "}
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => handleTabChange("user")}
              >
                Switch to Customer Login
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="link-switch-auth"
                onClick={() => handleTabChange("register")}
              >
                Sign up for free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
