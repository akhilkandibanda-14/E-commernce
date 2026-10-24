import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DEMO_LOGIN_ENABLED } from "../../utils/env";

const LoginPage = () => {
  const { user, isAdmin, login, quickLogin, register, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: 'user' | 'admin' | 'register'
  // The shop's sign-in page is for customers only; admins sign in from /admin.
  const requestedMode = searchParams.get("mode");
  const initialMode = requestedMode === "register" ? "register" : "user";
  const [mode, setMode] = useState(initialMode);
  const redirectPath = searchParams.get("redirect") || (mode === "admin" ? "/admin" : "/");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (isAdmin && mode === "admin") {
        navigate("/admin");
      } else if (searchParams.get("redirect")) {
        navigate(searchParams.get("redirect"));
      }
    }
  }, [user, isAdmin, mode, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (mode === "register") {
      if (!name.trim()) return setErrorMsg("Please enter your name.");
      if (!email.trim()) return setErrorMsg("Please enter your email.");
      if (password.length < 6) return setErrorMsg("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");

      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg("Account created! Redirecting...");
        setTimeout(() => navigate(redirectPath), 1000);
      }
    } else {
      if (!email.trim() || !password) {
        return setErrorMsg("Please fill in both email and password.");
      }

      const res = await login(email, password, mode === "admin" ? "admin" : null);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg("Success! Redirecting...");
        setTimeout(() => navigate(mode === "admin" ? "/admin" : redirectPath), 800);
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
      setSuccessMsg(role === "admin" ? "Admin verified! Opening Admin Portal..." : "Signed in as Customer!");
      setTimeout(() => navigate(role === "admin" ? "/admin" : redirectPath), 700);
    }
  };

  return (
    <div className="login-page-container">
      <div className="container">
        <div className="login-card-wrapper">
          <div className={`login-page-card ${mode === "admin" ? "admin-mode-card" : ""}`}>
            
            {/* Header Brand */}
            <div className="login-brand-header">
              <Link to="/" className="login-brand-link">
                <img src="/giftingwellness-logo.png" alt="Giftingwellness" className="login-logo" />
                <div className="login-brand-text-col">
                  <span className="login-brand-name">Giftingwellness</span>
                  <span className="login-brand-tagline">Corporate Gifting Solutions</span>
                </div>
              </Link>
              {mode === "admin" ? (
                <div className="admin-status-badge">
                  <i className="fa-solid fa-shield-halved"></i> Store Admin Portal
                </div>
              ) : (
                <div className="user-status-badge">
                  <i className="fa-regular fa-user"></i> Customer Access
                </div>
              )}
            </div>

            {/* Mode Switch Tabs */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${mode === "user" ? "active" : ""}`}
                onClick={() => {
                  setMode("user");
                  setErrorMsg("");
                }}
              >
                Customer Sign In
              </button>
              <button
                type="button"
                className={`login-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
              >
                Create Account
              </button>
            </div>

            {/* Demo 1-Click login banner (local development only) */}
            {!DEMO_LOGIN_ENABLED ? null : mode === "admin" ? (
              <div className="page-demo-box admin-demo">
                <div>
                  <strong>⚡ Instant Admin Access</strong>
                  <p>Test product management with the official admin profile</p>
                </div>
                <button
                  type="button"
                  className="btn-quick-demo btn-admin-demo"
                  onClick={() => handleQuickDemo("admin")}
                  disabled={loading}
                >
                  Sign In as Admin (1-Click)
                </button>
              </div>
            ) : mode === "user" ? (
              <div className="page-demo-box user-demo">
                <div>
                  <strong>🛍️ Instant Customer Access</strong>
                  <p>Explore orders, cart, and personalized shopping</p>
                </div>
                <button
                  type="button"
                  className="btn-quick-demo"
                  onClick={() => handleQuickDemo("user")}
                  disabled={loading}
                >
                  Sign In as Customer (1-Click)
                </button>
              </div>
            ) : null}

            {/* Alerts */}
            {errorMsg && (
              <div className="auth-alert error-alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert success-alert">
                <i className="fa-solid fa-circle-check"></i>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "register" && (
                <div className="form-group">
                  <label htmlFor="lp-name">Full Name</label>
                  <div className="input-with-icon">
                    <i className="fa-regular fa-id-badge input-icon"></i>
                    <input
                      id="lp-name"
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
                <label htmlFor="lp-email">
                  {mode === "admin" ? "Admin Email" : "Email Address"}
                </label>
                <div className="input-with-icon">
                  <i className="fa-regular fa-envelope input-icon"></i>
                  <input
                    id="lp-email"
                    type="email"
                    placeholder={mode === "admin" ? "admin@giftingwellness.com" : "name@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="lp-pass">Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock input-icon"></i>
                  <input
                    id="lp-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="form-group">
                  <label htmlFor="lp-confirm">Confirm Password</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-lock input-icon"></i>
                    <input
                      id="lp-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {DEMO_LOGIN_ENABLED && (
              <div className="form-info-note">
                {mode === "admin" ? (
                  <span>
                    <i className="fa-solid fa-shield-cat"></i> Preset Admin: <code>admin@giftingwellness.com</code> / <code>admin123</code>
                  </span>
                ) : (
                  <span>
                    <i className="fa-solid fa-user-check"></i> Preset Customer: <code>user@giftingwellness.com</code> / <code>user123</code>
                  </span>
                )}
              </div>
              )}

              <button
                type="submit"
                className={`btn-auth-submit ${mode === "admin" ? "btn-admin-submit" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                  </span>
                ) : mode === "admin" ? (
                  "Access Admin Management →"
                ) : mode === "register" ? (
                  "Create Free Account"
                ) : (
                  "Sign In to Giftingwellness"
                )}
              </button>
            </form>

            <div className="login-card-footer">
              <Link to="/" className="back-to-store-link">
                ← Back to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
