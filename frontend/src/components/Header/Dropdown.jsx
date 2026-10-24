import { Link } from "react-router-dom";

const Dropdown = ({ dropdownShow }) => {
  return (
    <div className={`dropdown-container ${dropdownShow ? "active" : ""}`}>
      <div className={`dropdown-sections-flex ${dropdownShow ? "active" : ""}`}>
        <div className="dropdown-col highlight-b2b-col">
          <p className="dropdown-col-title">
            <i className="fa-solid fa-gift" style={{ marginRight: "6px", color: "var(--success)" }}></i>
            Corporate & Drinkware
          </p>
          <ul className="dropdown-items-flex">
            <li>
              <Link to="/products/drinkware/1120677" className="featured-dropdown-item">
                ⭐ UG Elixir Cork Mug (UGDB65)
              </Link>
            </li>
            <li>
              <Link to="/products/drinkware/1120678">
                Smart Temp Flask 500ml
              </Link>
            </li>
            <li>
              <Link to="/products/corporate/1120679">
                Executive Eco Hamper Set
              </Link>
            </li>
            <li>
              <Link to="/products?category=drinkware">
                All Drinkware Catalog →
              </Link>
            </li>
          </ul>
        </div>

        <div className="dropdown-col">
          <p className="dropdown-col-title">Casual Wear</p>
          <ul className="dropdown-items-flex">
            <li><Link to="/products?style=casual">All Casual</Link></li>
            <li><Link to="/products?search=T-shirt">T-shirts</Link></li>
            <li><Link to="/products?search=Jeans">Denim Jeans</Link></li>
            <li><Link to="/products?search=Jacket">Jackets & Overshirts</Link></li>
          </ul>
        </div>

        <div className="dropdown-col">
          <p className="dropdown-col-title">Formal Attire</p>
          <ul className="dropdown-items-flex">
            <li><Link to="/products?style=formal">All Formal</Link></li>
            <li><Link to="/products?search=Blazer">Tailored Blazers</Link></li>
            <li><Link to="/products?search=Shirt">Dress Shirts</Link></li>
            <li><Link to="/products?search=Trousers">Pleated Trousers</Link></li>
          </ul>
        </div>

        <div className="dropdown-col">
          <p className="dropdown-col-title">Party & Night Out</p>
          <ul className="dropdown-items-flex">
            <li><Link to="/products?style=party">All Party Styles</Link></li>
            <li><Link to="/products?search=Dress">Evening Dresses</Link></li>
            <li><Link to="/products?search=Velvet">Velvet Collection</Link></li>
            <li><Link to="/products?search=Satin">Silk & Satin</Link></li>
          </ul>
        </div>

        <div className="dropdown-col">
          <p className="dropdown-col-title">Gym & Fitness</p>
          <ul className="dropdown-items-flex">
            <li><Link to="/products?style=gym">All Gym Wear</Link></li>
            <li><Link to="/products?search=Leggings">Active Leggings</Link></li>
            <li><Link to="/products?search=Training">Training Tees</Link></li>
            <li><Link to="/products?search=Hoodie">Runners Hoodies</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
