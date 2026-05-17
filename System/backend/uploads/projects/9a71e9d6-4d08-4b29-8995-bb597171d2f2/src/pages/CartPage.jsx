import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div style={styles.empty}>
        <h2>Your cart is empty</h2>
        <Link to="/" style={styles.backLink}>
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Shopping Cart</h1>
      <div style={styles.layout}>
        <div style={styles.items}>
          {cart.map(item => (
            <div key={item.id} style={styles.item}>
              <img src={item.image} alt={item.name} style={styles.itemImage} />
              <div style={styles.itemInfo}>
                <h3>{item.name}</h3>
                <p>{formatCurrency(item.price)}</p>
              </div>
              <div style={styles.quantityControls}>
                <button onClick={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}><Plus size={16} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
        <div style={styles.summary}>
          <h3>Order Summary</h3>
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <hr style={styles.hr} />
          <div style={{ ...styles.summaryRow, fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <button style={styles.checkoutBtn}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  empty: { textAlign: 'center', padding: '4rem 0' },
  backLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', marginTop: '1rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' },
  items: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  item: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', gap: '1rem' },
  itemImage: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' },
  itemInfo: { flex: 1 },
  quantityControls: { display: 'flex', alignItems: 'center', gap: '1rem' },
  qtyBtn: { border: '1px solid #e5e7eb', background: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px' },
  removeBtn: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' },
  summary: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', height: 'fit-content' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', margin: '1rem 0' },
  hr: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '1rem 0' },
  checkoutBtn: { width: '100%', padding: '1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }
};

export default CartPage;