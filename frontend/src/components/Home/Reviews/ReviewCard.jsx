import React from "react";
import StarRating from "./StarRating";

const ReviewCard = ({ text, firstName, lastNameLetter, company, rating }) => {
  return (
    <div className="review-card">
      <StarRating rating={rating || 5} />
      <h3 className="title--sm">
        {firstName} {lastNameLetter ? lastNameLetter.toUpperCase() + "." : ""}
        <i className="fa-solid fa-circle-check fa-sm" style={{ color: "var(--success)", marginLeft: "6px" }}></i>
        {company && <span className="review-company-badge"> · {company}</span>}
      </h3>
      <p className="text--gray">{text}</p>
    </div>
  );
};

export default ReviewCard;
