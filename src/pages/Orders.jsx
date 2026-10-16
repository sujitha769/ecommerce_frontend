
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { money } from '../context/CartContext';
import { fetchOrders } from '../api/client';

const PM_LABEL = {
  UPI: 'UPI',
  CARD: 'Card',
  NETBANKING: 'Net Banking',
  COD: 'Cash on Delivery',
};

const STATUS_LABEL = {
  PLACED: 'Order Placed',
  PENDING_PAYMENT: 'Payment Pending',
  CONFIRMED: 'Confirmed',
  AWAITING_PAYMENT_ON_DELIVERY: 'Cash on Delivery',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASS = {
  CONFIRMED: 'status-done',
  CANCELLED: 'status-cancelled',
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

export default function Orders() {
  const { user } = useAuth();
  const location = useLocation();

  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        setError('');
        const result = await fetchOrders(user.id);

        if (active) {
          setOrders(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your orders.');
          setOrders([]);
        }
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, [user.id]);

  if (!orders) {
    return <div className="skeleton big" />;
  }

  return (
    <>
      <h2 className="page-title">
        My Orders <small>({orders.length})</small>
      </h2>

      {location.state?.placed && (
        <div className="success">
          <div className="tick">✓</div>
          <div>
            <b>Order placed successfully!</b>
            <p>
              Your order <b>{location.state.placed}</b> was placed successfully.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="box">
          <p>{error}</p>
          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="empty">
          <div className="empty-emoji">📦</div>
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <Link to="/" className="btn">
            Start Shopping
          </Link>
        </div>
      )}

      {!error &&
        orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const status = order.status || 'PLACED';
          const cancelled = status === 'CANCELLED';

          const total = Number(order.totalAmount ?? 0);

          return (
            <div className="box order" key={order.id}>
              <div className="order-head">
                <div>
                  <b>Order #{order.id}</b>
                  <small className="muted">
                    {formatDate(order.createdAt)}
                  </small>
                </div>

                <span
                  className={`status ${STATUS_CLASS[status] || ''}`}
                >
                  {STATUS_LABEL[status] || status.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="order-items">
                {items.length === 0 ? (
                  <p className="muted">
                    Product details are unavailable for this order.
                  </p>
                ) : (
                  items.map((item, index) => {
                    const productId = item.productId;
                    const name =
                      item.productName || item.name || 'Product';

                    const quantity = Number(
                      item.quantity ?? item.qty ?? 1
                    );

                    const unitPrice = Number(
                      item.unitPrice ?? item.price ?? 0
                    );

                    const subtotal = Number(
                      item.subtotal ?? unitPrice * quantity
                    );

                    const colors = Array.isArray(item.bg)
                      ? item.bg
                      : ['#f3f4f6', '#e5e7eb'];

                    const firstColor = colors[0] || '#f3f4f6';
                    const secondColor = colors[1] || firstColor;

                    return (
                      <div
                        className="oi"
                        key={item.id ?? `${order.id}-${productId ?? index}`}
                      >
                        <div
                          className="pimg pimg-mini"
                          style={{
                            background: `linear-gradient(135deg, ${firstColor}, ${secondColor})`,
                          }}
                        >
                          <span>{item.emoji || '📦'}</span>
                        </div>

                        <div className="oi-info">
                          {productId != null ? (
                            <Link to={`/product/${productId}`}>
                              {name}
                            </Link>
                          ) : (
                            <span>{name}</span>
                          )}

                          <small className="muted">
                            Qty: {quantity}
                            {item.size ? ` · Size: ${item.size}` : ''}
                          </small>
                        </div>

                        <b>{money(subtotal)}</b>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="order-foot">
                <span className="muted">
                  {order.address?.name
                    ? `Deliver to ${order.address.name}${
                        order.address.city
                          ? `, ${order.address.city}`
                          : ''
                      }`
                    : 'Delivery details are not available'}
                </span>

                <span>
                  {order.paymentMethod
                    ? `${PM_LABEL[order.paymentMethod] || order.paymentMethod} · `
                    : ''}
                  <b>{STATUS_LABEL[status] || status}</b>
                  {' · Total '}
                  <b>{money(total)}</b>
                </span>
              </div>

              {cancelled && (
                <p className="muted">
                  This order was cancelled.
                </p>
              )}
            </div>
          );
        })}
    </>
  );
}
