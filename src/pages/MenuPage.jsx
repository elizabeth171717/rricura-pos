import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../constants/constants";

const CLIENT_ID = "universalmenu";

function MenuPage() {
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState("");
  const [loading, setLoading] = useState(true);

  const [noteModal, setNoteModal] = useState(null);
  const [tempNote, setTempNote] = useState("");

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  /* ---------------- NORMALIZE MENU ---------------- */

  const normalizeMenu = (raw) => {
    if (!raw?.sections) return raw;

    return {
      ...raw,
      sections: raw.sections.map((section) => {
        const sectionId = section.id || section._id || section.section;

        const items =
          section.items?.map((item, idx) => ({
            ...item,
            menuId: `${sectionId}::nogroup::${item.id || item.name || idx}`,
            price: Number(item.price || 0),
          })) || [];

        const groups =
          section.groups?.map((group, gidx) => {
            const groupId = group.id || group._id || group.groupName || gidx;

            return {
              ...group,
              items:
                group.items?.map((item, idx) => ({
                  ...item,
                  menuId: `${sectionId}::${groupId}::${
                    item.id || item.name || idx
                  }`,
                  price: Number(item.price || 0),
                })) || [],
            };
          }) || [];

        return { ...section, items, groups };
      }),
    };
  };

  /* ---------------- FETCH MENU ---------------- */

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/${CLIENT_ID}/menu`);
        const data = await res.json();
        setMenu(normalizeMenu(data));
      } catch (err) {
        console.error("Menu fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  /* ---------------- CART HELPERS ---------------- */

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
          price: item.price,
          quantity: 1,
          note: "",
        },
      ]);
    }
  };

  const removeItem = (rowId) =>
    setCart((prev) => prev.filter((r) => r._id !== rowId));

  const duplicateItem = (row) =>
    setCart((prev) => [...prev, { ...row, _id: makeCartId(row.menuId) }]);

  /* ---------------- NOTES ---------------- */

  const openNoteModal = (rowId) => {
    const row = cart.find((r) => r._id === rowId);
    setTempNote(row?.note || "");
    setNoteModal(rowId);
  };

  const saveNote = () => {
    setCart((prev) =>
      prev.map((r) => (r._id === noteModal ? { ...r, note: tempNote } : r))
    );
    setNoteModal(null);
    setTempNote("");
  };

  /* ---------------- TOTALS ---------------- */

  const subtotal = cart.reduce((s, r) => s + r.price * r.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  /* ---------------- PAYMENT ---------------- */

  const handlePayment = async () => {
    if (!paymentType) return alert("Select payment type");

    try {
      await axios.post(`${BACKEND_URL}/api/orders`, {
        items: cart,
        subtotal,
        tax,
        total,
        paymentType,
        source: "POS",
      });

      alert("Payment successful");
      setCart([]);
      setPaymentType("");
    } catch (err) {
      alert("Payment failed");
      console.error(err);
    }
  };

  if (loading) return <div>Loading menu...</div>;
  if (!menu) return <div>No menu available</div>;

  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  /* ---------------- RENDER MENU ---------------- */

  /* ================= RENDER MENU ================= */
  const renderMenu = () => {
    return (
      <>
        {/* SECTION BAR */}
        {/* TOP STICKY SECTION TOGGLE (ONLY WHEN SELECTED) */}
        {selectedSection && (
          <div className="section-tabs">
            {menu.sections
              .filter((s) => s.section !== selectedSection.section)
              .map((section) => (
                <button
                  key={section.section}
                  className="section-tab-btn"
                  onClick={() => {
                    setSelectedSection(section);
                    setSelectedGroup(null);
                  }}
                >
                  {section.section}
                </button>
              ))}
          </div>
        )}

        {/* INITIAL SECTION LIST */}
        {!selectedSection && (
          <div className="section-list">
            {menu.sections.map((section) => (
              <button
                key={section.section}
                className="section-btn"
                onClick={() => {
                  setSelectedSection(section);
                  setSelectedGroup(null);
                }}
              >
                {section.section}
              </button>
            ))}
          </div>
        )}

        {/* ITEMS */}
        {selectedSection && (
          <>
            <h2 className="selected-section-title">
              {selectedSection.section}
            </h2>

            {selectedSection.groups.length > 0 ? (
              <div className="group-grid">
                {chunkArray(selectedSection.groups, 2).map((row, rowIndex) => (
                  <div key={rowIndex} className="group-row">
                    <div className="group-row-buttons">
                      {row.map((group) => (
                        <button
                          key={group.groupName}
                          className={
                            selectedGroup?.groupName === group.groupName
                              ? "group-btn active"
                              : "group-btn"
                          }
                          onClick={() => setSelectedGroup(group)}
                        >
                          {group.groupName}
                        </button>
                      ))}
                    </div>

                    {/* ITEMS APPEAR DIRECTLY UNDER THIS ROW */}
                    {row.some(
                      (g) => g.groupName === selectedGroup?.groupName
                    ) && (
                      <ItemGrid
                        items={selectedGroup.items}
                        addToCart={addToCart}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <ItemGrid items={selectedSection.items} addToCart={addToCart} />
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="pos-app">
      {/* LEFT / MENU */}
      <div className="menu-panel">
        <h1 className="pos-title">POS Menu</h1>

        {renderMenu()}
      </div>

      {/* RIGHT / ORDER SUMMARY (ONLY SHOW IF CART HAS ITEMS) */}
      {cart.length > 0 && (
        <div className="order-summary">
          <h2>Order Summary</h2>

          {cart.map((row) => (
            <div key={row._id} className="order-row">
              <div>
                <p>
                  {row.name} × {row.quantity}
                </p>
                {row.note && <p>📝 {row.note}</p>}
              </div>

              <div className="order-actions">
                <button onClick={() => openNoteModal(row._id)}>📝</button>
                <button onClick={() => duplicateItem(row)}>🔁</button>
                <button onClick={() => removeItem(row._id)}>❌</button>
              </div>
            </div>
          ))}

          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>Tax: ${tax.toFixed(2)}</p>
          <p>Total: ${total.toFixed(2)}</p>

          <button className="pay-btn" onClick={handlePayment}>
            Complete Payment
          </button>
        </div>
      )}

      {/* NOTE MODAL */}
      {noteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
            />

            <div>
              <button onClick={() => setNoteModal(null)}>Cancel</button>
              <button onClick={saveNote}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- ITEM GRID ---------------- */

function ItemGrid({ items, addToCart }) {
  return (
    <div className="item-grid">
      {items
        .filter((i) => i.visible !== false && i.available !== false)
        .map((item) => (
          <button
            key={item.menuId}
            className="item-card"
            onClick={() => addToCart(item)}
          >
            {item.image && <img src={item.image} alt={item.name} />}
            <p>{item.name}</p>
            <p>${item.price.toFixed(2)}</p>
          </button>
        ))}
    </div>
  );
}

export default MenuPage;
