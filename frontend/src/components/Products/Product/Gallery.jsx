import { useState, useEffect } from "react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";

const Gallery = ({ mainImage, images, title = "Product" }) => {
  const [currentImage, setCurrentImage] = useState(mainImage);

  useEffect(() => {
    setCurrentImage(mainImage);
  }, [mainImage]);

  const handleThumbnailClick = (image) => {
    setCurrentImage(image);
  };

  return (
    <div className="gallery">
      <img
        src={currentImage}
        alt={title}
        className="thumbnail-main"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
      <div className="thumbnails-gallery">
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            className="thumbnail-button"
            onClick={() => handleThumbnailClick(image)}
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-pressed={currentImage === image}
          >
            <img
              src={image}
              alt=""
              width="150"
              height="150"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
              className={`thumbnail-small ${
                currentImage === image ? "active-thumbnail" : ""
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
