import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";
import { getNewArrivals, getBestSellers, fetchProductsSafe } from "../../../data/products";

const HomeCategory = ({
  title = "Considered Favourites",
  subtitle = "Discover the pieces customers return to.",
  filterType = "bestSeller", // "bestSeller" | "newArrival"
  category,
}) => {
  const [productList, setProductList] = useState(() => {
    if (filterType === "newArrival" || title.toLowerCase().includes("new")) {
      return getNewArrivals(4);
    }
    return getBestSellers(4);
  });

  useEffect(() => {
    let isMounted = true;
    if (category) {
      fetchProductsSafe(category).then((data) => {
        if (isMounted && data && data.length > 0) {
          setProductList(data.slice(0, 4));
        }
      });
    } else {
      // Prioritize curated corporate & festive gifting catalog
      if (filterType === "newArrival" || title.toLowerCase().includes("new")) {
        setProductList(getNewArrivals(4));
      } else {
        setProductList(getBestSellers(4));
      }
    }
    return () => {
      isMounted = false;
    };
  }, [category, filterType, title]);

  return (
    <div className="container home-category">
      <div className="home-category-header">
        <h2 className="category-heading title">{title}</h2>
        {subtitle && <p className="category-subheading">{subtitle}</p>}
      </div>

      <div className="grid-category-squares">
        {productList.map((product) => (
          <CategoryProduct key={product.id} {...product} />
        ))}
      </div>

      <div className="home-category-cta-row">
        <Link to="/products" className="btn-luxury btn-outline btn-category-view-all">
          View all products
        </Link>
      </div>
    </div>
  );
};

export default HomeCategory;
