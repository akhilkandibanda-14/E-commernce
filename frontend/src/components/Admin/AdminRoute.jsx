import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { DEMO_LOGIN_ENABLED } from "../../utils/env";

const AdminRoute = ({ children }) => {
  const { user, isAdmin, openAuthModal, quickLogin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <i className="fa-solid fa-circle-notch fa-spin"></i>
        <p>Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="admin-unauthorized-container">
        <div className="admin-unauthorized-card">
          <div className="unauthorized-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2>Admin Privileges Required</h2>
          <p>
            {user
              ? `You are currently signed in as "${user.name}" (${user.email}) which is a regular Customer account.`
              : "You must be logged in as an Administrator to view and manage products."}
          </p>

          <div className="unauthorized-actions">
            {DEMO_LOGIN_ENABLED && (
              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => quickLogin("admin")}
              >
                <i className="fa-solid fa-key"></i> 1-Click Sign In as Store Admin
              </button>
            )}
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => openAuthModal("admin")}
            >
              Enter Admin Credentials
            </button>
            <Link to="/" className="link-return-home">
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
