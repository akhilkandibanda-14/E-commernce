import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Path from "../Path";
import Gallery from "./Gallery";
import ProductDescription from "./ProductDescription";
import ProductInfoTabs from "./ProductInfoTabs";
import HomeCategory from "../../Home/HomeCategory/HomeCategory";
import { getProductById } from "../../../data/products";

const Product = ({ addToCart }) => {
  const [productDetails, setProductDetails] = useState({});
  const [sizeWarning, setSizeWarning] = useState(false);
  const params = useParams();
  const navigate = useNavigate();

  const handleSizeWarning = (bool) => {
    setSizeWarning(bool);
  };

  useEffect(() => {
    // 1. Check Backend API first (including newly added admin products)
    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found in API");
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.product) {
          const p = data.product;
          setProductDetails({
            ...p,
            price: Number(p.price).toFixed(2),
            images:
              p.images && p.images.length > 0
                ? p.images
                : p.img
                ? [p.img, p.img, p.img]
                : [],
          });
          return;
        }
        throw new Error("Invalid API product");
      })
      .catch(() => {
        // 2. Fallback to local curated products
        const localProduct = getProductById(params.id);
        if (localProduct) {
          setProductDetails({
            ...localProduct,
            price: Number(localProduct.price).toFixed(2),
          });
          return;
        }

        // Product not found in backend or local catalog
        setProductDetails({ notFound: true });
      });
  }, [params.id]);

  if (productDetails.notFound) {
    return (
      <main className="container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "50vh" }}>
        <i className="fa-solid fa-gift fa-3x" style={{ color: "var(--line-strong)", marginBottom: "16px" }}></i>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--ink)", margin: "0 0 8px" }}>Gift Item Not Found</h2>
        <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
          This product is no longer available or may have moved to a different gifting category.
        </p>
        <button
          type="button"
          onClick={() => navigate("/products")}
          style={{
            padding: "12px 24px",
            background: "var(--forest)",
            color: "var(--paper)",
            borderRadius: "24px",
            border: "none",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Explore Corporate Gifting Collections →
        </button>
      </main>
    );
  }

  const galleryImages =
    productDetails.images && productDetails.images.length > 0
      ? productDetails.images
      : productDetails.image
      ? [productDetails.image, productDetails.image, productDetails.image]
      : [];

  return (
    <>
      <Path
        path={[
          {
            route: params.category || "Shop",
            link: `/products/${params.category || ""}`,
          },
          {
            route: productDetails.title || "Product Details",
            link: "#",
          },
        ]}
      />
      <main id="main-content" className="product-page container">
        <div className="product-container">
          {galleryImages.length > 0 && (
            <Gallery
              mainImage={galleryImages[0]}
              images={galleryImages}
              title={productDetails.title}
            />
          )}
          <ProductDescription
            details={productDetails}
            addToCart={addToCart}
            sizeWarning={sizeWarning}
            handleSizeWarning={handleSizeWarning}
          />
        </div>
        <ProductInfoTabs details={productDetails} />
        <HomeCategory
          title="You might also like"
          category={params.category || "men's clothing"}
        />
      </main>
    </>
  );
};

export default Product;
