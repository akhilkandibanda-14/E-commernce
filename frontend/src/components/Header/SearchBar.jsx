import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 300ms debounced live query with AbortController cancellation
  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=6`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setSuggestions(data.products);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowDropdown(true);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return; // Ignore aborted requests from new user keystrokes
        }
        console.error("Autocomplete search error:", err);
        setError("Unable to load product suggestions.");
        setSuggestions([]);
        setShowDropdown(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      if (!showDropdown && suggestions.length > 0) {
        setShowDropdown(true);
        return;
      }
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      if (suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // If an item was navigated to via keyboard arrows, navigate directly to it
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selected = suggestions[selectedIndex];
      setShowDropdown(false);
      setSelectedIndex(-1);
      setSearchTerm("");
      navigate(`/products/${encodeURIComponent(selected.category || "item")}/${selected.id}`);
      return;
    }

    if (searchTerm.trim()) {
      setShowDropdown(false);
      setSelectedIndex(-1);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setError(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="search-bar-wrapper" ref={containerRef}>
      <form onSubmit={handleSubmit} role="search" className="search-bg flex-form">
        <button type="submit" className="btn-search" aria-label="Search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
        <input
          ref={inputRef}
          type="search"
          name="search-product"
          aria-label="Search gifts"
          className="input-search"
          placeholder="Search bottles, hampers, bags, brands"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim().length >= 2 && (suggestions.length > 0 || loading || error)) {
              setShowDropdown(true);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-activedescendant={
            selectedIndex >= 0 && suggestions[selectedIndex]
              ? `suggestion-option-${suggestions[selectedIndex].id}`
              : undefined
          }
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          className="search-suggestions-dropdown"
          role="listbox"
          id="search-suggestions"
        >
          {loading ? (
            <div className="search-suggestions-status">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>Searching live catalog...</span>
            </div>
          ) : error ? (
            <div className="search-suggestions-status error">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="search-suggestions-status">
              <span>No products found for "{searchTerm}"</span>
            </div>
          ) : (
            <>
              <p className="search-suggestions-header">Products ({suggestions.length})</p>
              <ul className="search-suggestions-list">
                {suggestions.map((item, idx) => {
                  const displayImage =
                    item.img ||
                    (Array.isArray(item.images) && item.images[0]) ||
                    item.image ||
                    "/introImageCompressed.jfif";

                  const isSelected = idx === selectedIndex;

                  return (
                    <li
                      key={item.id}
                      id={`suggestion-option-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <Link
                        to={`/products/${encodeURIComponent(item.category || "item")}/${item.id}`}
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchTerm("");
                          setSelectedIndex(-1);
                        }}
                        className={`search-suggestion-item ${isSelected ? "selected" : ""}`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <img
                          src={displayImage}
                          alt={item.title}
                          className="suggestion-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/introImageCompressed.jfif";
                          }}
                        />
                        <div className="suggestion-info">
                          <p className="suggestion-title">{item.title}</p>
                          <p className="suggestion-price">
                            ₹{Number(item.price).toFixed(2)}
                            {item.brand && <span className="suggestion-brand"> · {item.brand}</span>}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="search-view-all-btn"
                onClick={handleSubmit}
              >
                View all results for "{searchTerm}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

