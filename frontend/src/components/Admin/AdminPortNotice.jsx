import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * AdminPortNotice
 * Displayed when an administrator or user attempts to access /admin routes
 * from the Customer Storefront port (5173).
 * Directs them to the dedicated Admin Management Portal (5174).
 */
const AdminPortNotice = () => {
  const adminUrl = `http://${window.location.hostname}:5174/admin`;
  const currentPort = window.location.port || "5173";
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="container admin-port-notice-wrapper">
      <div className="admin-port-notice-card">
        {/* Animated Shield Icon */}
        <div className="notice-shield-halo">
          <i className="fa-solid fa-shield-halved"></i>
        </div>

        <div>
          <span className="notice-badge-pill">
            <i className="fa-solid fa-lock"></i> Dedicated Management Environment
          </span>
          <h1 className="notice-heading">
            Admin Management Portal is on Port 5174
          </h1>
          <p className="notice-lead-text">
            You are currently on the <strong>Customer Storefront Port ({currentPort})</strong>.
            For data security and role separation, catalogue modifications, adding products, and bulk imports are managed exclusively on the dedicated Admin Management Portal.
          </p>
        </div>

        {/* Dual Port Architecture Comparison */}
        <div className="port-comparison-grid">
          <div className="port-box-card current">
            <div className="port-box-header">
              <span className="port-box-tag">Active User Port</span>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Read-Only Mode</span>
            </div>
            <h3 className="port-box-title">Port 5173</h3>
            <ul className="port-feature-list">
              <li className="port-feature-item enabled">
                <i className="fa-solid fa-circle-check"></i>
                <span>Customer Browse, Cart & Checkout</span>
              </li>
              <li className="port-feature-item enabled">
                <i className="fa-solid fa-circle-check"></i>
                <span>Real-Time Catalog Search</span>
              </li>
              <li className="port-feature-item disabled">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>Catalog Mutation API (403 Forbidden)</span>
              </li>
            </ul>
          </div>

          <div className="port-box-card target">
            <div className="port-box-header">
              <span className="port-box-tag">Admin Management Port</span>
              <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>Full Access</span>
            </div>
            <h3 className="port-box-title">Port 5174</h3>
            <ul className="port-feature-list">
              <li className="port-feature-item enabled">
                <i className="fa-solid fa-circle-check"></i>
                <span>Direct Product Photo Upload & Image Storage</span>
              </li>
              <li className="port-feature-item enabled">
                <i className="fa-solid fa-circle-check"></i>
                <span>Live Catalog Editor & Price Management</span>
              </li>
              <li className="port-feature-item enabled">
                <i className="fa-solid fa-circle-check"></i>
                <span>Bulk CSV/JSON Importer & Rollback Engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Synchronization Info */}
        <div className="db-sync-card">
          <i className="fa-solid fa-database db-sync-icon"></i>
          <p className="db-sync-text">
            <strong>Shared Real-Time Database:</strong> Both ports share the live backend catalog database (<code>catalog.json</code>).
            When you publish or import a product on Port 5174, it reflects immediately on the Port 5173 customer storefront without needing a server restart.
          </p>
        </div>

        {/* Action Controls */}
        <div className="notice-actions-row">
          <a href={adminUrl} className="btn-launch-admin" title="Open Admin Portal">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            Open Admin Portal (Port 5174)
          </a>

          <Link to="/products" className="btn-return-storefront">
            <i className="fa-solid fa-bag-shopping"></i>
            Continue to Products Storefront
          </Link>

          <button
            type="button"
            className="btn-copy-url"
            onClick={handleCopyUrl}
            title="Copy URL to clipboard"
          >
            <i className={`fa-solid ${copied ? "fa-check text-green" : "fa-copy"}`}></i>
            <span>{copied ? "URL Copied!" : "Copy Admin URL"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPortNotice;
