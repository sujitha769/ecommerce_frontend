import { Link, useNavigate } from 'react-router-dom';
import { useCart, money } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductImage } from '../components/ProductCard';
import PriceSummary from '../components/PriceSummary';

export default function Cart() {
  const { items, removeItem, setQty, totals, keyOf } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add products you love and they will show up here.</p>
        <Link to="/" className="btn">Start Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="page-title">My Cart <small>({totals.count} items)</small></h2>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((i) => {
            const key = keyOf(i);
            return (
              <div className="box cart-item" key={key}>
                <Link to={`/product/${i.product.id}`}><ProductImage product={i.product} size="thumb" /></Link>
                <div className="ci-info">
                  <Link to={`/product/${i.product.id}`} className="ci-name">{i.product.name}</Link>
                  <small className="muted">Size: {i.size}</small>
                  <div className="price-row">
                    <b className="price">{money(i.product.price)}</b>
                    <s className="mrp">{money(i.product.mrp)}</s>
                    <span className="off">{Math.round(((i.product.mrp - i.product.price) / i.product.mrp) * 100)}% off</span>
                  </div>
                  <div className="ci-actions">
                    <div className="qty">
                      <button onClick={() => setQty(key, i.qty - 1)} disabled={i.qty <= 1}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(key, i.qty + 1)} disabled={i.qty >= 10}>+</button>
                    </div>
                    <button
                      className="remove"
                      onClick={() => {
                        removeItem(key);
                        toast('Removed from cart');
                      }}
                    >
                      🗑 Remove
                    </button>
                  </div>
                </div>
                <b className="ci-total">{money(i.product.price * i.qty)}</b>
              </div>
            );
          })}
        </div>

        <PriceSummary totals={totals}>
          <button className="btn btn-block" onClick={() => navigate('/checkout')}>Continue to Checkout</button>
        </PriceSummary>
      </div>
    </>
  );
}
