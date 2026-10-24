import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchMobile = ({ mobileSearchShow, handleMouseClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus the field when the overlay opens; Escape closes it.
  useEffect(() => {
    if (!mobileSearchShow) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") handleMouseClick();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSearchShow, handleMouseClick]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleMouseClick();
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`mobile-search-container ${mobileSearchShow ? "opened" : ""}`}
    >
      <div className="mobile-search-close">
        <button onClick={handleMouseClick} aria-label="Close search" type="button">
          <i className="fa-solid fa-xmark fa-2xl" aria-hidden="true"></i>
        </button>
      </div>
      <div className="mobile-search">
        <button type="submit" className="btn-search" aria-label="Search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
        <input
          ref={inputRef}
          type="search"
          name="search-product"
          id="search-product"
          aria-label="Search gifts"
          placeholder="Search bottles, hampers, bags, brands"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </form>
  );
};

export default SearchMobile;
