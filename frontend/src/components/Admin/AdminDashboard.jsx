import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products?limit=100");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error("Failed to load catalog", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(getAdminApiUrl(`/api/products/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setActionNotice({
          type: "success",
          message: `Product "${title}" was successfully deleted from the catalog.`,
        });
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(data.message || "Failed to delete product");
      }
    } catch (err) {
      alert("Error deleting product: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSubcategory =
      selectedSubcategory === "all" ||
      p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase();

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Unique categories for filter
  const categoriesList = ["all", ...new Set(products.map((p) => p.category?.toLowerCase()).filter(Boolean))];

  // Unique subcategories for filter
  const subcategoriesList = [
    "all",
    ...new Set(
      products
        .filter((p) => selectedCategory === "all" || p.category?.toLowerCase() === selectedCategory.toLowerCase())
        .map((p) => p.subcategory)
        .filter(Boolean)
    ),
  ];

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />

        <main className="container admin-main-content">
          {/* Dashboard Header Bar */}
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-boxes-stacked"></i> Store Inventory & Products
              </h1>
              <p className="admin-page-desc">
                Review existing products, check inventory, monitor prices, and add new items.
              </p>
            </div>
            <div className="admin-header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link to="/admin/import" className="btn-admin-outline">
                <i className="fa-solid fa-file-import"></i> Bulk Import
              </Link>
              <Link to="/admin/add-product" className="btn-admin-cta">
                <i className="fa-solid fa-plus-circle"></i> Add New Product
              </Link>
            </div>
          </div>

          {/* Action Notice Banner */}
          {actionNotice && (
            <div className={`admin-notice-banner ${actionNotice.type}`} role="status">
              <i className="fa-solid fa-circle-check"></i>
              <span>{actionNotice.message}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <section className="admin-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-blue">
                <i className="fa-solid fa-box-open"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Catalog Products</span>
                <span className="kpi-number">{products.length}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-green">
                <i className="fa-solid fa-tags"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Active Categories</span>
                <span className="kpi-number">{categoriesList.length - 1}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-purple">
                <i className="fa-solid fa-mug-hot"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Drinkware & Gifts</span>
                <span className="kpi-number">
                  {products.filter((p) => p.category === "drinkware").length}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-amber">
                <i className="fa-solid fa-shirt"></i>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Apparel Items</span>
                <span className="kpi-number">
                  {products.filter((p) => p.category?.includes("clothing")).length}
                </span>
              </div>
            </div>
          </section>

          {/* Catalog Management Section */}
          <section className="admin-catalog-panel">
            <div className="catalog-toolbar">
              <div className="search-box-admin">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search products by title, SKU, brand, or tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchTerm("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls-admin">
                <label htmlFor="cat-filter">Category:</label>
                <select
                  id="cat-filter"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("all");
                  }}
                  className="admin-select-filter"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.toUpperCase()}
                    </option>
                  ))}
                </select>

                {subcategoriesList.length > 1 && (
                  <>
                    <label htmlFor="subcat-filter">Subcategory:</label>
                    <select
                      id="subcat-filter"
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="admin-select-filter"
                    >
                      {subcategoriesList.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub === "all" ? "All Subcategories" : sub}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <button
                  type="button"
                  className="btn-refresh-admin"
                  onClick={fetchCatalog}
                  title="Reload catalog from backend"
                >
                  <i className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`}></i>
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="admin-table-loading">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <p>Loading catalog items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="admin-table-empty">
                <i className="fa-solid fa-box-archive"></i>
                <h3>No products matched your criteria</h3>
                <p>Try clearing your search filters or add a new product.</p>
                <Link to="/admin/add-product" className="btn-admin-cta">
                  + Add First Product
                </Link>
              </div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category & Subcategory</th>
                      <th>Selling Price</th>
                      <th>M.R.P. / Discount</th>
                      <th>MOQ / Delivery</th>
                      <th>Rating</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const discount = p.discountPercent || 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="product-cell-flex">
                              <img
                                src={p.image || p.img || (p.images && p.images[0]) || "/introImageCompressed.jfif"}
                                alt={p.title}
                                className="table-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/introImageCompressed.jfif";
                                }}
                              />
                              <div className="product-cell-meta">
                                <span className="product-table-title" title={p.title}>
                                  {p.title}
                                </span>
                                <div className="product-table-sub">
                                  <span className="sku-badge">{p.sku || `#${p.id}`}</span>
                                  {p.brand && <span className="brand-badge">{p.brand}</span>}
                                  {p.isNew && <span className="new-badge">NEW</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="category-cell">
                              <span className="pill-category">{p.category}</span>
                              {p.subcategory && (
                                <span className="pill-subcategory" title={`Subcategory: ${p.subcategory}`}>
                                  <i className="fa-solid fa-layer-group"></i> {p.subcategory}
                                </span>
                              )}
                              {p.style && <span className="pill-style">{p.style}</span>}
                            </div>
                          </td>

                          <td>
                            <span className="price-bold">₹{p.price}</span>
                          </td>

                          <td>
                            {p.originalPrice && p.originalPrice > p.price ? (
                              <div className="discount-cell">
                                <span className="mrp-strikethrough">₹{p.originalPrice}</span>
                                <span className="discount-tag">-{discount}%</span>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          <td>
                            <span className="moq-info">MOQ: {p.moq || 1}</span>
                            <span className="delivery-info">{p.deliveryDays || "3–5 Days"}</span>
                          </td>

                          <td>
                            <span className="rating-pill">
                              ★ {p.rating?.rate || "5.0"}
                              <small>({p.rating?.count || 1})</small>
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div className="table-action-btns">
                              <Link
                                to={`/products/${encodeURIComponent(p.category || "all")}/${p.id}`}
                                className="btn-table-view"
                                title="View live on storefront"
                                target="_blank"
                              >
                                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                              </Link>
                              <Link
                                to={`/admin/edit-product/${encodeURIComponent(p.id)}`}
                                className="btn-table-view btn-table-edit"
                                title="Edit this product"
                                aria-label={`Edit ${p.title}`}
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </Link>
                              <button
                                type="button"
                                className="btn-table-delete"
                                title="Delete this product"
                                onClick={() => handleDelete(p.id, p.title)}
                                disabled={deleting}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </AdminRoute>
  );
};

export default AdminDashboard;
