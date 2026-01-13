import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function OrderSummaryPage() {
  const { cart, removeItem } = useCart();

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <div>
      <h1>Order Summary</h1>

      {cart.map((item) => (
        <div key={item.cartId}>
          <p>
            {item.name} — ${item.price}
          </p>
          <button onClick={() => removeItem(item.cartId)}>❌ Delete</button>
        </div>
      ))}

      <h2>Subtotal: ${subtotal.toFixed(2)}</h2>

      <Link to="/checkout">Go to Checkout</Link>
    </div>
  );
}
