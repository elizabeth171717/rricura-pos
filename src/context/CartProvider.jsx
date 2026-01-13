import React, { useState } from "react";
import { CartContext } from "./CartContext";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const makeCartId = (menuId) =>
    `${menuId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addToCart = (item) => {
    const existing = cart.find((r) => r.menuId === item.menuId);

    if (existing) {
      setCart((prev) =>
        prev.map((r) =>
          r.menuId === item.menuId ? { ...r, quantity: r.quantity + 1 } : r
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          _id: makeCartId(item.menuId),
          menuId: item.menuId,
          name: item.name,
          price: Number(item.price || 0),
          quantity: 1,
          note: "",
        },
      ]);
    }
  };

  const removeRow = (rowId) =>
    setCart((prev) => prev.filter((r) => r._id !== rowId));

  const duplicateRow = (row) =>
    setCart((prev) => [...prev, { ...row, _id: makeCartId(row.menuId) }]);

  const updateNote = (rowId, note) =>
    setCart((prev) => prev.map((r) => (r._id === rowId ? { ...r, note } : r)));

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, r) => s + r.price * r.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeRow,
        duplicateRow,
        updateNote,
        clearCart,
        subtotal,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
