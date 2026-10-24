import { getAdminApiUrl } from "../../utils/apiConfig";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import {
  parseCSVToProducts,
  parseJSONToProducts,
  getSampleCSVTemplate,
  getSampleJSONTemplate,
  downloadFile,
} from "../../utils/csvParser";
import "../../styles/admin-import.css";

const AdminImport = () => {
  const { token, user } = useAuth();

  // Active Tab: "import" | "history"
  const [activeTab, setActiveTab] = useState("import");

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Parsed Product Rows & Client Validation
  const [parsedProducts, setParsedProducts] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState("skip"); // "skip" | "update" | "error"

  // Live Catalog (for local conflict checking)
  const [existingCatalog, setExistingCatalog] = useState([]);

  // Preview Filter & Search
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewFilter, setPreviewFilter] = useState("all"); // "all" | "valid" | "error" | "conflict"

  // Dry-Run State
  const [dryRunning, setDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);

  // Import Commit State
  const [importing, setImporting] = useState(false);
  const [importSuccessResult, setImportSuccessResult] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [serverConflictData, setServerConflictData] = useState(null);

  // Confirmation Modals
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  // Import History & Rollback State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackNotice, setRollbackNotice] = useState(null);

  // Load existing catalog for client-side conflict awareness
  const fetchExistingCatalog = async () => {
    try {
      const res = await fetch("/api/products?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setExistingCatalog(data.products || []);
      }
    } catch (e) {
      console.warn("Could not pre-fetch catalog for conflict check:", e.message);
    }
  };

  // Load import history from server
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(getAdminApiUrl("/api/products/bulk-import/history"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to load history:", errData.message);
      }
    } catch (err) {
      console.error("Error fetching history:", err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingCatalog();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle File Selection
  const handleFileProcess = (file) => {
    if (!file) return;

    // Reset previous execution results
    setServerError(null);
    setServerConflictData(null);
    setDryRunResult(null);
    setImportSuccessResult(null);

    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "csv" && ext !== "json") {
      setFileErrors(["Invalid file type. Please upload a .csv or .json file."]);
      setSelectedFile(null);
      setParsedProducts([]);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileErrors(["File is too large. Maximum supported upload size is 5 MB."]);
      setSelectedFile(null);
      setParsedProducts([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (ext === "csv") {
        const { products, errors } = parseCSVToProducts(text);
        if (products.length === 0) {
          setFileErrors(errors.length > 0 ? errors : ["No valid product rows found in CSV."]);
          setParsedProducts([]);
          setSelectedFile(null);
        } else if (products.length > 500) {
          setFileErrors([
            `Import batch contains ${products.length} rows, which exceeds the maximum allowed batch size of 500 products.`,
          ]);
          setParsedProducts([]);
          setSelectedFile(null);
        } else {
          setFileErrors([]);
          setParsedProducts(products);
          setSelectedFile({ name: file.name, size: file.size, count: products.length });
        }
      } else {
        const { products, error } = parseJSONToProducts(text);
        if (error) {
          setFileErrors([error]);
          setParsedProducts([]);
          setSelectedFile(null);
        } else if (products.length === 0) {
          setFileErrors(["JSON array of products is empty."]);
          setParsedProducts([]);
          setSelectedFile(null);
        } else if (products.length > 500) {
          setFileErrors([
            `Import batch contains ${products.length} rows, which exceeds the maximum allowed batch size of 500 products.`,
          ]);
          setParsedProducts([]);
          setSelectedFile(null);
        } else {
          setFileErrors([]);
          setParsedProducts(products);
          setSelectedFile({ name: file.name, size: file.size, count: products.length });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setParsedProducts([]);
    setFileErrors([]);
    setDryRunResult(null);
    setServerError(null);
    setServerConflictData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Client-side row analysis against existing catalog
  const rowsWithStatus = parsedProducts.map((p, idx) => {
    const rowNum = idx + 1;
    const errors = [];

    // Title
    if (!p.title || !String(p.title).trim()) {
      errors.push("Title is required");
    } else if (String(p.title).length > 200) {
      errors.push("Title exceeds 200 chars");
    }

    // Price
    const price = Number(p.price !== undefined ? p.price : p.mrp);
    if (isNaN(price) || price <= 0) {
      errors.push("Positive price is required");
    }

    // Category
    if (!p.category || !String(p.category).trim()) {
      errors.push("Category is required");
    }

    // Conflict check with existing catalog
    const existingMatch = existingCatalog.find(
      (cp) =>
        (p.id && Number(cp.id) === Number(p.id)) ||
        (p.sku && String(cp.sku).toLowerCase() === String(p.sku).toLowerCase())
    );

    let calculatedAction = "add";
    if (errors.length > 0) {
      calculatedAction = "error";
    } else if (existingMatch) {
      if (duplicateStrategy === "update") {
        calculatedAction = "update";
      } else if (duplicateStrategy === "skip") {
        calculatedAction = "skip";
      } else {
        calculatedAction = "conflict";
      }
    }

    return {
      rowNum,
      item: p,
      errors,
      existingMatch,
      action: calculatedAction,
    };
  });

  // Filtered Preview Rows
  const filteredRows = rowsWithStatus.filter((r) => {
    const matchSearch =
      !previewSearch ||
      r.item.title?.toLowerCase().includes(previewSearch.toLowerCase()) ||
      r.item.sku?.toLowerCase().includes(previewSearch.toLowerCase()) ||
      r.item.category?.toLowerCase().includes(previewSearch.toLowerCase());

    if (!matchSearch) return false;

    if (previewFilter === "valid") return r.errors.length === 0;
    if (previewFilter === "error") return r.errors.length > 0;
    if (previewFilter === "conflict") return Boolean(r.existingMatch);
    return true;
  });

  // Client counts
  const totalRowsCount = parsedProducts.length;
  const clientErrorRows = rowsWithStatus.filter((r) => r.errors.length > 0).length;
  const clientConflictRows = rowsWithStatus.filter((r) => Boolean(r.existingMatch)).length;
  const clientAddRows = rowsWithStatus.filter((r) => r.action === "add").length;
  const clientUpdateRows = rowsWithStatus.filter((r) => r.action === "update").length;
  const clientSkipRows = rowsWithStatus.filter((r) => r.action === "skip").length;

  // Execute Dry-Run Validation
  const handleDryRun = async () => {
    if (parsedProducts.length === 0) return;

    try {
      setDryRunning(true);
      setServerError(null);
      setServerConflictData(null);
      setDryRunResult(null);

      const res = await fetch(
        getAdminApiUrl(`/api/products/bulk-import?dryRun=true&duplicateStrategy=${duplicateStrategy}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            products: parsedProducts,
            duplicateStrategy,
            dryRun: true,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setDryRunResult(data);
      } else if (res.status === 409 && data.conflicts) {
        setServerConflictData(data);
        setServerError(data.message);
      } else {
        setServerError(data.message || "Dry-run validation failed on server.");
        if (data.errors) {
          setServerConflictData({ errors: data.errors });
        }
      }
    } catch (err) {
      setServerError(`Network error executing dry run: ${err.message}`);
    } finally {
      setDryRunning(false);
    }
  };

  // Open Real Import Modal
  const openImportConfirmation = () => {
    if (parsedProducts.length === 0) return;
    setConfirmCheckbox(false);
    setShowImportConfirmModal(true);
  };

  // Commit Real Import
  const handleCommitImport = async () => {
    if (importing || !confirmCheckbox) return;

    try {
      setImporting(true);
      setServerError(null);
      setServerConflictData(null);

      const res = await fetch(
        getAdminApiUrl(`/api/products/bulk-import?duplicateStrategy=${duplicateStrategy}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            products: parsedProducts,
            duplicateStrategy,
            dryRun: false,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 201 && data.success) {
        setImportSuccessResult(data);
        setShowImportConfirmModal(false);
        // Refresh catalog for conflict awareness
        fetchExistingCatalog();
      } else if (res.status === 409 && data.conflicts) {
        setServerConflictData(data);
        setServerError(data.message);
        setShowImportConfirmModal(false);
      } else if (res.status === 409 || res.status === 423) {
        setServerError(data.message || "Import locked: another operation is in progress.");
        setShowImportConfirmModal(false);
      } else {
        setServerError(data.message || "Failed to commit catalogue import.");
        if (data.errors) {
          setServerConflictData({ errors: data.errors });
        }
        setShowImportConfirmModal(false);
      }
    } catch (err) {
      setServerError(`Network error committing import: ${err.message}`);
      setShowImportConfirmModal(false);
    } finally {
      setImporting(false);
    }
  };

  // Execute Rollback
  const handleRollback = async () => {
    if (!rollbackTarget || rollingBack) return;

    try {
      setRollingBack(true);
      setRollbackNotice(null);

      const res = await fetch(getAdminApiUrl("/api/products/bulk-import/rollback"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          importId: rollbackTarget.importId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRollbackNotice({
          type: "success",
          message: data.message || `Import ${rollbackTarget.importId} successfully rolled back.`,
        });
        setRollbackTarget(null);
        fetchHistory();
        fetchExistingCatalog();
      } else {
        setRollbackNotice({
          type: "error",
          message: data.message || "Failed to execute rollback.",
        });
      }
    } catch (err) {
      setRollbackNotice({
        type: "error",
        message: `Network error executing rollback: ${err.message}`,
      });
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <AdminRoute>
      <div className="admin-page-container">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Breadcrumb & Header Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-file-import"></i> Bulk Product Importer
              </h1>
              <p className="admin-page-desc">
                Safely validate, preview, and batch-import catalogue products with automated snapshots and instant rollback.
              </p>
            </div>

            <div className="admin-breadcrumb-actions">
              <Link to="/admin" className="btn-admin-outline">
                <i className="fa-solid fa-arrow-left"></i> Return to Catalog
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="import-nav-tabs">
            <button
              type="button"
              className={`import-tab-btn ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i> Import Products
              {parsedProducts.length > 0 && (
                <span className="import-tab-badge">{parsedProducts.length} rows</span>
              )}
            </button>
            <button
              type="button"
              className={`import-tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <i className="fa-solid fa-clock-rotate-left"></i> Snapshot History & Rollbacks
              {historyList.length > 0 && (
                <span className="import-tab-badge">{historyList.length}</span>
              )}
            </button>
          </div>

          {/* TAB 1: IMPORT PRODUCTS */}
          {activeTab === "import" && (
            <div className="admin-import-container">
              {/* Import Success Banner */}
              {importSuccessResult && (
                <div className="import-card" style={{ borderColor: "var(--success)", background: "var(--sage-tint)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--success)",
                        color: "var(--paper)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 6px 0", color: "var(--success)", fontSize: 18, fontWeight: 800 }}>
                        Import Committed Successfully!
                      </h3>
                      <p style={{ margin: "0 0 12px 0", color: "var(--success)", fontSize: 13.5 }}>
                        Snapshot ID:{" "}
                        <code style={{ background: "var(--sage-tint)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {importSuccessResult.importId}
                        </code>{" "}
                        — {importSuccessResult.message}
                      </p>

                      <div className="stats-banner" style={{ marginBottom: 16 }}>
                        <div className="stat-pill success">
                          <span className="stat-title">Added</span>
                          <span className="stat-value">{importSuccessResult.summary?.added || 0}</span>
                        </div>
                        <div className="stat-pill info">
                          <span className="stat-title">Updated</span>
                          <span className="stat-value">{importSuccessResult.summary?.updated || 0}</span>
                        </div>
                        <div className="stat-pill warning">
                          <span className="stat-title">Skipped</span>
                          <span className="stat-value">{importSuccessResult.summary?.skipped || 0}</span>
                        </div>
                        <div className="stat-pill">
                          <span className="stat-title">Catalog Total</span>
                          <span className="stat-value">{importSuccessResult.catalogTotal || existingCatalog.length}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Link to="/admin" className="btn-admin-cta" style={{ fontSize: 13, padding: "8px 14px" }}>
                          <i className="fa-solid fa-table-list"></i> View Catalog Management
                        </Link>
                        <button
                          type="button"
                          className="btn-admin-outline"
                          onClick={() => {
                            setImportSuccessResult(null);
                            removeFile();
                          }}
                        >
                          <i className="fa-solid fa-plus"></i> Import Another Batch
                        </button>
                        <button
                          type="button"
                          className="btn-admin-outline"
                          onClick={() => setActiveTab("history")}
                        >
                          <i className="fa-solid fa-clock-rotate-left"></i> View Snapshot History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Server Error / Conflict Banner */}
              {serverError && (
                <div className="import-card" style={{ borderColor: "#f87171", background: "var(--danger-tint)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <i
                      className="fa-solid fa-triangle-exclamation"
                      style={{ fontSize: 24, color: "var(--danger)", marginTop: 2 }}
                    ></i>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "var(--danger)", fontSize: 15, fontWeight: 800 }}>
                        Import Validation Rejected
                      </h4>
                      <p style={{ margin: "0 0 10px 0", color: "var(--danger)", fontSize: 13 }}>
                        {serverError}
                      </p>

                      {serverConflictData?.conflicts && (
                        <div style={{ background: "var(--paper)", padding: "10px 14px", borderRadius: 8, border: "1px solid #fecaca", maxHeight: 180, overflowY: "auto" }}>
                          <strong style={{ fontSize: 12, color: "var(--danger)" }}>Detected Conflicts:</strong>
                          <ul style={{ margin: "6px 0 0 0", paddingLeft: 18, fontSize: 12, color: "#7f1d1d" }}>
                            {serverConflictData.conflicts.map((c, idx) => (
                              <li key={idx}>
                                Row {c.row}: {c.field.toUpperCase()} <code>{c.value}</code> matches existing item #{c.existingProduct?.id} ("{c.existingProduct?.title}")
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {serverConflictData?.errors && (
                        <div style={{ background: "var(--paper)", padding: "10px 14px", borderRadius: 8, border: "1px solid #fecaca", maxHeight: 180, overflowY: "auto" }}>
                          <strong style={{ fontSize: 12, color: "var(--danger)" }}>Row-Level Errors:</strong>
                          <ul style={{ margin: "6px 0 0 0", paddingLeft: 18, fontSize: 12, color: "#7f1d1d" }}>
                            {serverConflictData.errors.map((e, idx) => (
                              <li key={idx}>
                                Row {e.row} ({e.field}): {e.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Dropzone Card */}
              {!selectedFile && (
                <div className="import-card">
                  <div
                    className={`dropzone-box ${dragActive ? "drag-active" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .json"
                      className="file-hidden-input"
                      onChange={handleFileChange}
                    />
                    <div className="dropzone-icon">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <div className="dropzone-title">Click to upload or drag & drop catalogue file</div>
                    <div className="dropzone-hint">
                      Supported formats: <strong>.CSV</strong> or <strong>.JSON</strong> (Max 500 rows, 5 MB file limit)
                    </div>
                    <div className="dropzone-actions">
                      <button type="button" className="btn-admin-cta" style={{ pointerEvents: "none" }}>
                        <i className="fa-solid fa-folder-open"></i> Browse Files
                      </button>
                    </div>
                  </div>

                  {/* File Selection Errors */}
                  {fileErrors.length > 0 && (
                    <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--danger-tint)", border: "1px solid #fecaca", borderRadius: 8, color: "var(--danger)", fontSize: 13 }}>
                      <strong>File Parse Error:</strong>
                      <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
                        {fileErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Downloadable Templates Section */}
                  <div className="template-download-group">
                    <span className="template-label">
                      <i className="fa-solid fa-circle-info"></i> Need the official catalogue format?
                    </span>
                    <div className="template-buttons">
                      <button
                        type="button"
                        className="btn-template"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile("shop_co_catalog_sample.csv", getSampleCSVTemplate(), "text/csv");
                        }}
                      >
                        <i className="fa-solid fa-file-csv"></i> Download Sample CSV
                      </button>
                      <button
                        type="button"
                        className="btn-template"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile("shop_co_catalog_sample.json", getSampleJSONTemplate(), "application/json");
                        }}
                      >
                        <i className="fa-solid fa-file-code"></i> Download Sample JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected File & Preview Section */}
              {selectedFile && (
                <>
                  {/* File Chip */}
                  <div className="selected-file-chip">
                    <div className="file-info-group">
                      <div className="file-badge-icon">
                        <i className={selectedFile.name.endsWith(".csv") ? "fa-solid fa-file-csv" : "fa-solid fa-file-code"}></i>
                      </div>
                      <div>
                        <div className="file-meta-name">{selectedFile.name}</div>
                        <div className="file-meta-sub">
                          {selectedFile.count} products identified • {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <button type="button" className="btn-remove-file" onClick={removeFile} title="Remove file and upload another">
                      <i className="fa-solid fa-trash-can"></i> Remove File
                    </button>
                  </div>

                  {/* Duplicate Strategy Selector */}
                  <div className="import-card strategy-section">
                    <div className="section-title">
                      <i className="fa-solid fa-sliders"></i> Duplicate Resolution Strategy
                    </div>
                    <div className="strategy-grid">
                      <div
                        className={`strategy-card ${duplicateStrategy === "skip" ? "selected" : ""}`}
                        onClick={() => setDuplicateStrategy("skip")}
                      >
                        <div className="strategy-card-header">
                          <span className="strategy-name">
                            <i className="fa-solid fa-forward" style={{ color: "var(--warning)" }}></i> Skip Existing
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="skip"
                            checked={duplicateStrategy === "skip"}
                            onChange={() => setDuplicateStrategy("skip")}
                            className="strategy-radio"
                          />
                        </div>
                        <p className="strategy-desc">
                          Safely skip products with matching SKU or ID. Only completely new items are appended to the catalogue.
                        </p>
                      </div>

                      <div
                        className={`strategy-card ${duplicateStrategy === "update" ? "selected" : ""}`}
                        onClick={() => setDuplicateStrategy("update")}
                      >
                        <div className="strategy-card-header">
                          <span className="strategy-name">
                            <i className="fa-solid fa-rotate" style={{ color: "#2563eb" }}></i> Update Existing
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="update"
                            checked={duplicateStrategy === "update"}
                            onChange={() => setDuplicateStrategy("update")}
                            className="strategy-radio"
                          />
                        </div>
                        <p className="strategy-desc">
                          Overwrite prices, titles, and descriptions for matching SKUs or IDs. Preserves original creation dates.
                        </p>
                      </div>

                      <div
                        className={`strategy-card ${duplicateStrategy === "error" ? "selected" : ""}`}
                        onClick={() => setDuplicateStrategy("error")}
                      >
                        <div className="strategy-card-header">
                          <span className="strategy-name">
                            <i className="fa-solid fa-shield-xmark" style={{ color: "var(--danger)" }}></i> Strict Error
                          </span>
                          <input
                            type="radio"
                            name="strategy"
                            value="error"
                            checked={duplicateStrategy === "error"}
                            onChange={() => setDuplicateStrategy("error")}
                            className="strategy-radio"
                          />
                        </div>
                        <p className="strategy-desc">
                          Halt and abort the entire import immediately if ANY product SKU or ID already exists in the catalogue.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary KPI Banner */}
                  <div className="stats-banner">
                    <div className="stat-pill">
                      <span className="stat-title">Total Rows</span>
                      <span className="stat-value">{totalRowsCount}</span>
                    </div>
                    <div className="stat-pill success">
                      <span className="stat-title">New Products (Add)</span>
                      <span className="stat-value">{clientAddRows}</span>
                    </div>
                    <div className="stat-pill info">
                      <span className="stat-title">Matches (Update)</span>
                      <span className="stat-value">{clientUpdateRows}</span>
                    </div>
                    <div className="stat-pill warning">
                      <span className="stat-title">Skipped</span>
                      <span className="stat-value">{clientSkipRows}</span>
                    </div>
                    {clientErrorRows > 0 && (
                      <div className="stat-pill danger">
                        <span className="stat-title">Validation Errors</span>
                        <span className="stat-value">{clientErrorRows}</span>
                      </div>
                    )}
                  </div>

                  {/* Dry Run Server Authoritative Breakdown */}
                  {dryRunResult && (
                    <div className="import-card" style={{ background: "var(--ivory)", borderColor: "#bfdbfe" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e40af", fontWeight: 700, fontSize: 15 }}>
                          <i className="fa-solid fa-circle-check"></i> Server Dry-Run Validation Passed
                        </div>
                        <span className="badge-pill neutral">Mode: {dryRunResult.duplicateStrategy.toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px 0" }}>
                        Server simulated import of <strong>{dryRunResult.totalReceived}</strong> products. No changes were made to the live catalogue or files.
                      </p>
                      <div className="stats-banner" style={{ margin: 0 }}>
                        <div className="stat-pill success">
                          <span className="stat-title">Would Add</span>
                          <span className="stat-value">{dryRunResult.summary?.wouldAdd ?? dryRunResult.summary?.added}</span>
                        </div>
                        <div className="stat-pill info">
                          <span className="stat-title">Would Update</span>
                          <span className="stat-value">{dryRunResult.summary?.wouldUpdate ?? dryRunResult.summary?.updated}</span>
                        </div>
                        <div className="stat-pill warning">
                          <span className="stat-title">Would Skip</span>
                          <span className="stat-value">{dryRunResult.summary?.wouldSkip ?? dryRunResult.summary?.skipped}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Preview Table */}
                  <div className="import-card">
                    <div className="preview-controls">
                      <div className="preview-filter-group">
                        <input
                          type="text"
                          placeholder="Search preview by title, SKU, category..."
                          value={previewSearch}
                          onChange={(e) => setPreviewSearch(e.target.value)}
                          className="preview-search-input"
                        />
                        <select
                          value={previewFilter}
                          onChange={(e) => setPreviewFilter(e.target.value)}
                          className="preview-filter-select"
                        >
                          <option value="all">All Rows ({rowsWithStatus.length})</option>
                          <option value="valid">Valid Rows ({rowsWithStatus.filter((r) => r.errors.length === 0).length})</option>
                          <option value="error">Has Errors ({clientErrorRows})</option>
                          <option value="conflict">Conflicts/Matches ({clientConflictRows})</option>
                        </select>
                      </div>

                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                        Showing {filteredRows.length} of {parsedProducts.length} rows
                      </div>
                    </div>

                    <div className="preview-table-wrap">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Action</th>
                            <th>SKU</th>
                            <th>Title</th>
                            <th>Price</th>
                            <th>MRP / Orig</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Sizes</th>
                            <th>Colors</th>
                            <th>Status / Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((r) => {
                            const hasError = r.errors.length > 0;
                            return (
                              <tr key={r.rowNum} className={hasError ? "has-error" : ""}>
                                <td style={{ fontWeight: 600, color: "var(--muted)" }}>{r.rowNum}</td>
                                <td>
                                  {r.action === "add" && <span className="badge-pill add"><i className="fa-solid fa-plus"></i> Add</span>}
                                  {r.action === "update" && <span className="badge-pill update"><i className="fa-solid fa-rotate"></i> Update</span>}
                                  {r.action === "skip" && <span className="badge-pill skip"><i className="fa-solid fa-forward"></i> Skip</span>}
                                  {r.action === "conflict" && <span className="badge-pill error"><i className="fa-solid fa-ban"></i> Conflict</span>}
                                  {r.action === "error" && <span className="badge-pill error"><i className="fa-solid fa-triangle-exclamation"></i> Error</span>}
                                </td>
                                <td>
                                  <code>{r.item.sku || <em style={{ color: "var(--muted)" }}>(auto)</em>}</code>
                                </td>
                                <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.item.title}>
                                  <strong>{r.item.title || <span style={{ color: "var(--danger)" }}>Missing Title</span>}</strong>
                                </td>
                                <td style={{ fontWeight: 700 }}>
                                  {r.item.price !== undefined ? `₹${r.item.price}` : <span style={{ color: "var(--danger)" }}>Missing</span>}
                                </td>
                                <td style={{ color: "var(--muted)" }}>
                                  {r.item.originalPrice ? `₹${r.item.originalPrice}` : "—"}
                                </td>
                                <td>
                                  <span style={{ textTransform: "capitalize" }}>{r.item.category || "—"}</span>
                                </td>
                                <td>{r.item.brand || "Giftingwellness"}</td>
                                <td style={{ fontSize: 11.5 }}>
                                  {Array.isArray(r.item.sizes) ? r.item.sizes.join(", ") : r.item.sizes || "—"}
                                </td>
                                <td style={{ fontSize: 11.5 }}>
                                  {Array.isArray(r.item.colors) ? r.item.colors.length + " colors" : r.item.colors || "—"}
                                </td>
                                <td>
                                  {hasError ? (
                                    <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 11.5 }}>
                                      {r.errors.join("; ")}
                                    </span>
                                  ) : r.existingMatch ? (
                                    <span style={{ color: "var(--warning)", fontSize: 11.5 }}>
                                      Matches #{r.existingMatch.id} ({r.existingMatch.sku})
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--success)", fontSize: 11.5 }}>Ready to import</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Bar */}
                    <div className="action-bar">
                      <div className="action-bar-info">
                        Ready to process <strong>{parsedProducts.length}</strong> products with <strong>{duplicateStrategy.toUpperCase()}</strong> strategy.
                      </div>
                      <div className="action-bar-buttons">
                        <button
                          type="button"
                          className="btn-admin-outline"
                          onClick={handleDryRun}
                          disabled={dryRunning || importing || clientErrorRows > 0}
                          title={clientErrorRows > 0 ? "Fix client validation errors first" : "Simulate import without mutating data"}
                        >
                          {dryRunning ? (
                            <>
                              <i className="fa-solid fa-circle-notch fa-spin"></i> Validating Dry Run...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-vial"></i> Run Dry-Run Validation
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-admin-cta"
                          onClick={openImportConfirmation}
                          disabled={dryRunning || importing || clientErrorRows > 0}
                          title={clientErrorRows > 0 ? "Fix validation errors before importing" : "Commit products to live catalogue"}
                        >
                          <i className="fa-solid fa-cloud-arrow-up"></i> Commit Bulk Import
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT HISTORY & ROLLBACK */}
          {activeTab === "history" && (
            <div className="admin-import-container">
              {/* Rollback Notification */}
              {rollbackNotice && (
                <div
                  className="import-card"
                  style={{
                    borderColor: rollbackNotice.type === "success" ? "#a7f3d0" : "#fecaca",
                    background: rollbackNotice.type === "success" ? "#ecfdf5" : "#fef2f2",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <i
                      className={rollbackNotice.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"}
                      style={{ color: rollbackNotice.type === "success" ? "#059669" : "#dc2626", fontSize: 20 }}
                    ></i>
                    <div style={{ color: rollbackNotice.type === "success" ? "#065f46" : "#991b1b", fontSize: 13.5, fontWeight: 600 }}>
                      {rollbackNotice.message}
                    </div>
                  </div>
                </div>
              )}

              <div className="import-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                      Catalogue Snapshots & Recovery Points
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
                      Every bulk import automatically creates an immutable pre-import backup. You can safely rollback to the latest snapshot as long as no subsequent catalogue mutations have occurred.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-admin-outline"
                    onClick={fetchHistory}
                    disabled={historyLoading}
                  >
                    <i className={`fa-solid fa-rotate ${historyLoading ? "fa-spin" : ""}`}></i> Refresh History
                  </button>
                </div>

                {historyLoading ? (
                  <div className="empty-state">
                    <i className="fa-solid fa-circle-notch fa-spin empty-state-icon"></i>
                    <div className="empty-state-title">Loading snapshot history...</div>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fa-solid fa-box-archive"></i>
                    </div>
                    <div className="empty-state-title">No Import Snapshots Found</div>
                    <p className="empty-state-desc">
                      Import snapshots will be automatically recorded here whenever you perform a bulk product import.
                    </p>
                  </div>
                ) : (
                  <div className="preview-table-wrap" style={{ maxHeight: "none" }}>
                    <table className="preview-table history-table">
                      <thead>
                        <tr>
                          <th>Import ID</th>
                          <th>Timestamp</th>
                          <th>Initiated By</th>
                          <th>Products In Backup</th>
                          <th>Revision Span</th>
                          <th>Status</th>
                          <th>Rollback Eligibility</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.map((snap) => {
                          const isEligible = snap.isRollbackEligible;
                          const isRolledBack = snap.status === "rolled_back";

                          return (
                            <tr key={snap.importId}>
                              <td>
                                <span className="history-id-code">{snap.importId}</span>
                              </td>
                              <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                                {new Date(snap.timestamp).toLocaleString()}
                              </td>
                              <td style={{ fontSize: 12 }}>{snap.initiatedBy || "admin"}</td>
                              <td style={{ fontWeight: 700 }}>{snap.productCount} products</td>
                              <td style={{ fontSize: 12 }}>
                                Rev {snap.preImportRevision} &rarr; Rev {snap.postImportRevision || "?"}
                              </td>
                              <td>
                                {isRolledBack ? (
                                  <span className="badge-pill rolled-back">
                                    <i className="fa-solid fa-clock-rotate-left"></i> Rolled Back
                                  </span>
                                ) : (
                                  <span className="badge-pill active">
                                    <i className="fa-solid fa-check"></i> Active
                                  </span>
                                )}
                              </td>
                              <td>
                                {isEligible ? (
                                  <span className="badge-pill add" title="Safe to restore: no newer catalogue changes exist">
                                    <i className="fa-solid fa-circle-check"></i> Eligible for Rollback
                                  </span>
                                ) : isRolledBack ? (
                                  <span className="badge-pill neutral">Already Restored</span>
                                ) : (
                                  <span
                                    className="badge-pill neutral"
                                    title="Rollback refused: newer catalogue modifications exist to protect current state"
                                  >
                                    <i className="fa-solid fa-lock"></i> Locked (Newer Mutations)
                                  </span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-rollback"
                                  disabled={!isEligible || rollingBack}
                                  onClick={() => setRollbackTarget(snap)}
                                  title={
                                    isEligible
                                      ? "Rollback catalogue to pre-import snapshot"
                                      : "Cannot rollback: newer catalogue mutations exist or already restored"
                                  }
                                >
                                  <i className="fa-solid fa-rotate-left"></i> Rollback
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* MODAL 1: CONFIRM REAL IMPORT */}
        {showImportConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowImportConfirmModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  <i className="fa-solid fa-cloud-arrow-up" style={{ color: "var(--warning)" }}></i> Confirm Catalogue Import
                </h3>
                <button
                  type="button"
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}
                  onClick={() => setShowImportConfirmModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-desc">
                  You are about to commit <strong>{parsedProducts.length} products</strong> to the live store catalogue.
                </p>

                <div className="modal-callout">
                  <strong>Selected Strategy: {duplicateStrategy.toUpperCase()}</strong>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: 18, fontSize: 12.5 }}>
                    <li><strong>{clientAddRows}</strong> new products will be created.</li>
                    {clientUpdateRows > 0 && <li><strong>{clientUpdateRows}</strong> existing products will be updated.</li>}
                    {clientSkipRows > 0 && <li><strong>{clientSkipRows}</strong> duplicate products will be skipped.</li>}
                    <li>An automated rollback snapshot will be created before saving.</li>
                  </ul>
                </div>

                <label className="modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "var(--ink)" }}
                  />
                  <span>
                    I confirm that I have verified the preview and intend to update the live product catalogue.
                  </span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setShowImportConfirmModal(false)}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-cta"
                  disabled={!confirmCheckbox || importing}
                  onClick={handleCommitImport}
                >
                  {importing ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Committing Import...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Confirm & Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CONFIRM ROLLBACK */}
        {rollbackTarget && (
          <div className="modal-overlay" onClick={() => setRollbackTarget(null)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "var(--danger)" }}>
                  <i className="fa-solid fa-rotate-left"></i> Confirm Catalogue Rollback
                </h3>
                <button
                  type="button"
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}
                  onClick={() => setRollbackTarget(null)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-desc">
                  Are you sure you want to rollback import snapshot <code>{rollbackTarget.importId}</code>?
                </p>

                <div className="modal-callout danger">
                  <strong>This action will restore the catalogue:</strong>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: 18, fontSize: 12.5 }}>
                    <li>The catalogue will revert to its state of <strong>{rollbackTarget.productCount} products</strong>.</li>
                    <li>Any products added during this import will be removed from the store.</li>
                    <li>Any updated fields will be restored to their pre-import values.</li>
                    <li>Catalogue revision will be incremented to mark this recovery.</li>
                  </ul>
                </div>

                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  Snapshot Timestamp: {new Date(rollbackTarget.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-admin-outline"
                  onClick={() => setRollbackTarget(null)}
                  disabled={rollingBack}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-admin-cta"
                  style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "var(--paper)" }}
                  disabled={rollingBack}
                  onClick={handleRollback}
                >
                  {rollingBack ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Restoring Catalogue...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate-left"></i> Confirm & Restore Catalogue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
};

export default AdminImport;
