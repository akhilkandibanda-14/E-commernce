const QuantityControls = ({handleDecrease, handleIncrease, quantity}) => {
    return (
        <div className="btn-pill btn-size item-number-container" role="group" aria-label="Quantity">
        <button
          type="button"
          className="change-quantity"
          aria-label="Decrease quantity by 1"
          onClick={handleDecrease}
          disabled={quantity <= 1}
        >
          <i className="fa-solid fa-minus" aria-hidden="true"></i>
        </button>
        <input
          type="number"
          className="item-number"
          value={quantity}
          aria-label="Quantity"
          aria-live="polite"
          readOnly
        />
        <button
          type="button"
          className="change-quantity"
          aria-label="Increase quantity by 1"
          onClick={handleIncrease}
        >
          <i className="fa-solid fa-plus" aria-hidden="true"></i>
        </button>
      </div>
    )
}

export default QuantityControls;
