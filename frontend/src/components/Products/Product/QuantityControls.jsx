const QuantityControls = ({
  handleDecrease,
  handleIncrease,
  quantity,
  amount,
  decreaseQuantity,
  increaseQuantity,
  onQuantityChange,
}) => {
  const currentQty = quantity !== undefined ? quantity : (amount !== undefined ? amount : 1);
  const onDec = handleDecrease || decreaseQuantity;
  const onInc = handleIncrease || increaseQuantity;

  return (
    <div className="btn-pill btn-size item-number-container" role="group" aria-label="Quantity">
      <button
        type="button"
        className="change-quantity"
        aria-label="Decrease quantity by 1"
        onClick={onDec}
        disabled={currentQty <= 1}
      >
        <i className="fa-solid fa-minus" aria-hidden="true"></i>
      </button>
      <input
        type="number"
        className="item-number"
        value={currentQty}
        min={1}
        max={10000}
        aria-label="Quantity"
        aria-live="polite"
        onChange={(e) => {
          if (onQuantityChange) {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) {
              onQuantityChange(val);
            }
          }
        }}
        readOnly={!onQuantityChange}
      />
      <button
        type="button"
        className="change-quantity"
        aria-label="Increase quantity by 1"
        onClick={onInc}
      >
        <i className="fa-solid fa-plus" aria-hidden="true"></i>
      </button>
    </div>
  );
};

export default QuantityControls;
