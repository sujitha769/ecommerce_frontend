import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { money } from '../context/CartContext';
import { fetchOrders } from '../api/client';

// Real backend lo status server nundi vastundi. Mock lo time batti progress avtundi (demo kosam 20s per stage).
const STAGES = ['Placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
const STAGE_MS = 20000;
const stageOf = (order, now) => Math.min(STAGES.length - 1, Math.floor((now - order.createdAt) / STAGE_MS));

const PM_LABEL = { UPI: 'UPI', CARD: 'Card', NETBANKING: 'Net Banking', COD: 'Cash on Delivery' };

export default function Orders() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchOrders(user.id).then(setOrders);
  }, [user.id]);

  // live tracking tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!orders) return <div className="skeleton big" />;

  return (
    <>
      <h2 className="page-title">My Orders <small>({orders.length})</small></h2>

      {location.state?.placed && (
        <div className="success">
          <div className="tick">✓</div>
          <div>
            <b>Order placed successfully!</b>
            <p>Your order <b>{location.state.placed}</b> is confirmed. Track it live below.</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">📦</div>
          <h3>No orders yet</h3>
          <p>When you place an order it will show up here.</p>
          <Link to="/" className="btn">Start Shopping</Link>
        </div>
      ) : (
        orders.map((o) => {
          const st = stageOf(o, now);
          const delivered = st === STAGES.length - 1;
          return (
            <div className="box order" key={o.id}>
              <div className="order-head">
                <div>
                  <b>Order #{o.id}</b>
                  <small className="muted">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                </div>
                <span className={`status ${delivered ? 'status-done' : ''}`}>{STAGES[st]}</span>
              </div>

              <div className="track">
                {STAGES.map((s, idx) => (
                  <div key={s} className={`t-step ${idx <= st ? 't-on' : ''}`}>
                    <i>{idx < st || delivered ? '✓' : idx + 1}</i>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <div className="order-items">
                {o.items.map((i, idx) => (
                  <div className="oi" key={idx}>
                    <div className="pimg pimg-mini" style={{ background: `linear-gradient(135deg, ${i.bg[0]}, ${i.bg[1]})` }}><span>{i.emoji}</span></div>
                    <div className="oi-info">
                      <Link to={`/product/${i.productId}`}>{i.name}</Link>
                      <small className="muted">Size: {i.size} · Qty: {i.qty}</small>
                    </div>
                    <b>{money(i.price * i.qty)}</b>
                  </div>
                ))}
              </div>

              <div className="order-foot">
                <span className="muted">Deliver to {o.address.name}, {o.address.city} - {o.address.pincode}</span>
                <span>{PM_LABEL[o.paymentMethod]} · <b>{o.paymentStatus}</b> · Total <b>{money(o.totals.total)}</b></span>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
