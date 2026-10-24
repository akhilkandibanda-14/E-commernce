import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CategoryProduct from "../Home/HomeCategory/CategoryProduct";
import FiltersSidebar from "./FiltersSidebar";
import PaginationButtons from "./PaginationButtons";
import Path from "./Path";
import { capitalize } from "../Helpers/Helpers";
import { fetchProductsSafe, getAllProducts, searchProducts } from "../../data/products";
import { STANDARDIZED_SIZES, normalizeSize } from "./SizeSelector";

const PRODUCTS_NUMBER = 9;

const Products = () => {
  const [products, setProducts] = useState(() => getAllProducts());
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState({ min: 0, max: 2000 });
  const [appliedPrice, setAppliedPrice] = useState({ min: 0, max: 2000 });
  const [size, setSize] = useState([]);
  const [appliedSize, setAppliedSize] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || params.category || "";
  const subcategoryQuery = searchParams.get("subcategory") || "";
  const styleQuery = searchParams.get("style") || "";

  // Dynamic catalog max price safely derived from active catalog (baseline: 2000)
  const catalogMaxPrice = useMemo(() => {
    if (!products || products.length === 0) return 2000;
    const maxVal = Math.max(...products.map((p) => Number(p.price) || 0));
    return Math.max(2000, Math.ceil(maxVal / 100) * 100);
  }, [products]);

  // Determine if the current products view has items with apparel/standard sizes
  const hasSizedProducts = useMemo(() => {
    return products.some((p) => {
      if (!p.sizes || p.sizes.length === 0) return false;
      return p.sizes.some((s) => {
        const norm = normalizeSize(s);
        return STANDARDIZED_SIZES.includes(norm);
      });
    });
  }, [products]);

  // Adjust default max if catalog dynamically requires a higher range
  useEffect(() => {
    setPrice((prev) => ({
      min: prev.min,
      max: prev.max === 2000 || prev.max === 500 ? catalogMaxPrice : Math.max(prev.max, catalogMaxPrice),
    }));
    setAppliedPrice((prev) => ({
      min: prev.min,
      max: prev.max === 2000 || prev.max === 500 ? catalogMaxPrice : Math.max(prev.max, catalogMaxPrice),
    }));
  }, [catalogMaxPrice]);

  // Synchronize style query from URL
  useEffect(() => {
    if (styleQuery) {
      setSelectedStyle(styleQuery);
    }
  }, [styleQuery]);

  // Load products when category, subcategory, search, or style changes
  useEffect(() => {
    setLoading(true);
    let isCancelled = false;

    const queryParts = [];
    if (searchQuery) queryParts.push(`search=${encodeURIComponent(searchQuery)}`);
    if (categoryQuery && categoryQuery !== "all") queryParts.push(`category=${encodeURIComponent(categoryQuery)}`);
    if (subcategoryQuery && subcategoryQuery !== "all") queryParts.push(`subcategory=${encodeURIComponent(subcategoryQuery)}`);
    if (styleQuery && styleQuery !== "all") queryParts.push(`style=${encodeURIComponent(styleQuery)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    fetch(`/api/products${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error("Catalog API error");
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          if (data && data.success && Array.isArray(data.products)) {
            setProducts(data.products);
          } else {
            setProducts(getAllProducts());
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          if (searchQuery) {
            setProducts(searchProducts(searchQuery));
          } else {
            const targetCategory = categoryQuery || styleQuery || "all";
            fetchProductsSafe(targetCategory)
              .then((p) => {
                if (!isCancelled) setProducts(p || getAllProducts());
              })
              .catch(() => {
                if (!isCancelled) setProducts(getAllProducts());
              });
          }
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    setActivePage(1);

    return () => {
      isCancelled = true;
    };
  }, [categoryQuery, subcategoryQuery, searchQuery, styleQuery]);

  // Prevent scroll when filter drawer is open on mobile
  useEffect(() => {
    if (isFilterOpen) {
      document.body.classList.add("body-noscroll");
    } else {
      document.body.classList.remove("body-noscroll");
    }
    return () => {
      document.body.classList.remove("body-noscroll");
    };
  }, [isFilterOpen]);

  const handlePriceEnter = (min, max) => {
    const numMin = min === "" ? 0 : Math.max(0, Number(min) || 0);
    const numMax = max === "" ? catalogMaxPrice : Number(max) || catalogMaxPrice;
    setPrice({ min: numMin, max: numMax });
  };

  const isSizeActive = (sizeOption) => {
    const norm = normalizeSize(sizeOption);
    return size.some((s) => normalizeSize(s) === norm) ? "size-active" : "";
  };

  const handleSizeClick = (newSize) => {
    const norm = normalizeSize(newSize);
    if (size.some((s) => normalizeSize(s) === norm)) {
      setSize(size.filter((s) => normalizeSize(s) !== norm));
    } else {
      setSize([...size, norm]);
    }
  };

  const handleFilterClick = () => {
    setAppliedPrice(price);
    setAppliedSize(size);
    setActivePage(1);
  };

  const clearAllFilters = () => {
    setPrice({ min: 0, max: catalogMaxPrice });
    setAppliedPrice({ min: 0, max: catalogMaxPrice });
    setSize([]);
    setAppliedSize([]);
    setSelectedStyle("");
    if (searchQuery || styleQuery) {
      setSearchParams({});
    }
    setActivePage(1);
  };

  // Filter predicate
  const productsFilterFn = (product) => {
    const numPrice = Number(product.price);
    // If appliedPrice.max is at or above catalog ceiling, allow products at or above to remain discoverable
    const matchesPrice =
      numPrice >= appliedPrice.min &&
      (appliedPrice.max >= catalogMaxPrice ? true : numPrice <= appliedPrice.max);

    const matchesSize =
      appliedSize.length === 0 ||
      (product.sizes &&
        product.sizes.some((s) => {
          const norm = normalizeSize(s);
          return appliedSize.some((as) => normalizeSize(as) === norm);
        })) ||
      (product.size &&
        appliedSize.some((as) => normalizeSize(as) === normalizeSize(product.size)));

    const matchesStyle =
      !selectedStyle ||
      (product.style && product.style.toLowerCase() === selectedStyle.toLowerCase());

    return matchesPrice && matchesSize && matchesStyle;
  };

  // Filter and sort products (proper top-level useMemo hook)
  const filteredProducts = useMemo(() => {
    let result = products.filter(productsFilterFn);

    // Apply category & subcategory filters locally as safety net
    if (categoryQuery && categoryQuery !== "all") {
      const cat = categoryQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.category?.toLowerCase() === cat ||
          p.style?.toLowerCase() === cat ||
          (cat === "bottles" && (p.category?.toLowerCase().includes("bottle") || p.title?.toLowerCase().includes("bottle"))) ||
          (cat === "mugs" && (p.category?.toLowerCase().includes("mug") || p.title?.toLowerCase().includes("mug")))
      );
    }

    if (subcategoryQuery && subcategoryQuery !== "all") {
      const sub = subcategoryQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.subcategory?.toLowerCase() === sub ||
          p.subcategory?.toLowerCase().includes(sub) ||
          p.title?.toLowerCase().includes(sub) ||
          p.description?.toLowerCase().includes(sub)
      );
    }

    if (sortOption === "price-low") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "price-high") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === "rating") {
      result = [...result].sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
    } else if (sortOption === "newest") {
      result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [products, appliedPrice, appliedSize, selectedStyle, sortOption, catalogMaxPrice, categoryQuery, subcategoryQuery]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    const startIndex = (activePage - 1) * PRODUCTS_NUMBER;
    const endIndex = startIndex + PRODUCTS_NUMBER;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, activePage]);

  // Title generation
  const pageTitle = useMemo(() => {
    if (subcategoryQuery && (categoryQuery || params.category)) {
      return `${capitalize(categoryQuery || params.category)} — ${subcategoryQuery}`;
    }
    if (subcategoryQuery) return `${subcategoryQuery} Collection`;
    if (categoryQuery && categoryQuery !== "all") return `${capitalize(categoryQuery)} Collection`;
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (selectedStyle) return `${capitalize(selectedStyle)} Collection`;
    if (params.category) return capitalize(params.category);
    return "All Products";
  }, [categoryQuery, subcategoryQuery, searchQuery, selectedStyle, params.category]);

  return (
    <main id="main-content" className="products-container products-page">
      <Path
        path={[
          {
            route: "All Products",
            link: "/products",
          },
          ...(categoryQuery && categoryQuery !== "all"
            ? [
                {
                  route: capitalize(categoryQuery),
                  link: `/products?category=${encodeURIComponent(categoryQuery)}`,
                },
              ]
            : []),
          ...(subcategoryQuery
            ? [
                {
                  route: subcategoryQuery,
                  link: `/products?category=${encodeURIComponent(categoryQuery || "")}&subcategory=${encodeURIComponent(subcategoryQuery)}`,
                },
              ]
            : []),
        ]}
      />
      <div className="container products-flex products-container-grid">
        <FiltersSidebar
          handleSizeClick={handleSizeClick}
          handleFilterClick={handleFilterClick}
          isSizeActive={isSizeActive}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          handlePriceEnter={handlePriceEnter}
          price={price}
          setPrice={setPrice}
          selectedStyle={selectedStyle}
          setSelectedStyle={(style) => {
            setSelectedStyle(style);
            setActivePage(1);
          }}
          clearAllFilters={clearAllFilters}
          catalogMaxPrice={catalogMaxPrice}
          showSizeFilter={hasSizedProducts}
        />
        <div className="products-column">
          <div className="products-heading-flex">
            <div>
              <h1 className="title">{pageTitle}</h1>
              <div className="active-cat-subcat-pills" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", alignItems: "center" }}>
                {categoryQuery && categoryQuery !== "all" && (
                  <span className="active-filter-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(36, 75, 60, 0.08)", color: "var(--forest)", padding: "4px 10px", border: "1px solid rgba(36, 75, 60, 0.2)", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>
                    <i className="fa-solid fa-shapes"></i> Category: <strong>{capitalize(categoryQuery)}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete("category");
                        setSearchParams(next);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--forest)", padding: "0 2px", fontWeight: "700" }}
                      title="Clear category filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {subcategoryQuery && (
                  <span className="active-filter-badge subcategory-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--forest)", color: "var(--paper)", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(36, 75, 60, 0.2)" }}>
                    <i className="fa-solid fa-tag"></i> Subcategory: <strong>{subcategoryQuery}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete("subcategory");
                        setSearchParams(next);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--paper)", padding: "0 2px", fontWeight: "700" }}
                      title="Clear subcategory filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {(searchQuery || (categoryQuery && categoryQuery !== "all") || subcategoryQuery) && (
                  <button
                    onClick={() => setSearchParams({})}
                    className="btn-clear-search"
                    style={{ fontSize: "12px", color: "var(--ribbon)", background: "none", border: "none", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
                  >
                    Clear all filters ✕
                  </button>
                )}
              </div>
            </div>
            <div className="products-sort">
              <button
                onClick={() => setIsFilterOpen((prevState) => !prevState)}
                aria-label="open filters"
                className="btn-search btn-filters-mobile"
              >
                <img
                  src="/filterIconEnabled.png"
                  width="32"
                  height="32"
                  alt="filter"
                />
              </button>
              <p className="text--sm text--gray products-number">
                Showing{" "}
                {filteredProducts.length === 0
                  ? 0
                  : (activePage - 1) * PRODUCTS_NUMBER + 1}
                -
                {Math.min(activePage * PRODUCTS_NUMBER, filteredProducts.length)}{" "}
                of {filteredProducts.length} products
              </p>
              <div
                className="dropdown-sort-container"
                onBlur={(e) =>
                  !e.currentTarget.contains(e.relatedTarget) &&
                  setIsSortOpen(false)
                }
              >
                <button
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="btn-dropdown-sort"
                >
                  Sort By:{" "}
                  {sortOption === "price-low"
                    ? "Lowest Price"
                    : sortOption === "price-high"
                    ? "Highest Price"
                    : sortOption === "rating"
                    ? "Top Rated"
                    : sortOption === "newest"
                    ? "Newest"
                    : "Featured"}
                  <i className="fa-solid fa-chevron-down" style={{ marginLeft: "6px" }}></i>
                </button>
                <div className={`dropdown-sort ${isSortOpen ? "open" : ""}`}>
                  <ul className="dropdown-sort-list">
                    <li>
                      <button
                        className="btn-dropdown-sort"
                        onClick={() => {
                          setSortOption("default");
                          setIsSortOpen(false);
                        }}
                      >
                        Featured
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn-dropdown-sort"
                        onClick={() => {
                          setSortOption("newest");
                          setIsSortOpen(false);
                        }}
                      >
                        Newest Arrivals
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn-dropdown-sort"
                        onClick={() => {
                          setSortOption("price-low");
                          setIsSortOpen(false);
                        }}
                      >
                        Lowest Price
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn-dropdown-sort"
                        onClick={() => {
                          setSortOption("price-high");
                          setIsSortOpen(false);
                        }}
                      >
                        Highest Price
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn-dropdown-sort"
                        onClick={() => {
                          setSortOption("rating");
                          setIsSortOpen(false);
                        }}
                      >
                        Top Rated
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="products-loading">
              <p>Loading curated products...</p>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="products-list">
              {paginatedProducts.map((product) => (
                <CategoryProduct key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="products-empty-state">
              <i className="fa-solid fa-shirt" style={{ fontSize: "3rem", color: "var(--line-strong)", marginBottom: "1rem" }}></i>
              <h2>No clothing items matched your filter</h2>
              <p className="text--gray">Try clearing some filters or searching for something else.</p>
              <button
                onClick={clearAllFilters}
                className="btn-pill btn-black"
                style={{ marginTop: "1rem" }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {filteredProducts.length > PRODUCTS_NUMBER && (
            <PaginationButtons
              activePage={activePage}
              setActivePage={setActivePage}
              products={filteredProducts}
              PRODUCTS_NUMBER={PRODUCTS_NUMBER}
              productsFilterFn={() => true}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;
