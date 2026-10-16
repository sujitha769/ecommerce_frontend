
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useCart, money } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

import {
  createOrder,
  fetchBackendCart,
  addBackendCartItem,
} from '../api/client';

import PriceSummary from '../components/PriceSummary';

const METHODS = [
  {
    id: 'UPI',
    label: 'UPI',
    sub: 'Google Pay, PhonePe, Paytm',
    icon: '📱',
  },
  {
    id: 'CARD',
    label: 'Credit / Debit Card',
    sub: 'Visa, Mastercard, RuPay',
    icon: '💳',
  },
  {
    id: 'NETBANKING',
    label: 'Net Banking',
    sub: 'All major banks',
    icon: '🏦',
  },
  {
    id: 'COD',
    label: 'Cash on Delivery',
    sub: 'Pay when you receive',
    icon: '💵',
  },
];

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Canara Bank',
  'Bank of Baroda',
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, totals, clear } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);

  const [addr, setAddr] = useState({
    name: user?.name || '',
    phone: '',
    pincode: '',
    line1: '',
    city: '',
    state: '',
  });

  const [method, setMethod] = useState('UPI');

  const [pay, setPay] = useState({
    upi: '',
    card: '',
    expiry: '',
    cvv: '',
    cardName: '',
    bank: BANKS[0],
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0 && !processing) {
    return <Navigate to="/cart" replace />;
  }

  const setA = (key) => (event) =>
    setAddr((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));

  const setP = (key) => (event) =>
    setPay((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));

  const validateAddress = () => {
    const nextErrors = {};

    if (addr.name.trim().length < 2) {
      nextErrors.name = 'Enter name';
    }

    if (!/^[6-9]\d{9}$/.test(addr.phone)) {
      nextErrors.phone = 'Enter valid 10 digit number';
    }

    if (!/^\d{6}$/.test(addr.pincode)) {
      nextErrors.pincode = 'Enter valid 6 digit pincode';
    }

    if (addr.line1.trim().length < 5) {
      nextErrors.line1 = 'Enter house no, street, area';
    }

    if (!addr.city.trim()) {
      nextErrors.city = 'Enter city';
    }

    if (!addr.state.trim()) {
      nextErrors.state = 'Enter state';
    }

    return nextErrors;
  };

  const validatePayment = () => {
    const nextErrors = {};

    if (
      method === 'UPI' &&
      !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(pay.upi)
    ) {
      nextErrors.upi = 'Enter valid UPI ID (name@bank)';
    }

    if (method === 'CARD') {
      if (pay.card.replace(/\s/g, '').length !== 16) {
        nextErrors.card = 'Enter 16 digit card number';
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(pay.expiry)) {
        nextErrors.expiry = 'Use MM/YY';
      }

      if (!/^\d{3}$/.test(pay.cvv)) {
        nextErrors.cvv = '3 digit CVV';
      }

      if (pay.cardName.trim().length < 2) {
        nextErrors.cardName = 'Name on card';
      }
    }

    return nextErrors;
  };

  const next = () => {
    const nextErrors = validateAddress();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  };

  const syncBackendCart = async () => {
    const backendItems = await fetchBackendCart(user.id);

    const desired = items.map((item) => ({
      productId: Number(item.product.id),
      quantity: Number(item.qty),
    }));

    const normalize = (cartItems) =>
      cartItems
        .map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        }))
        .sort((a, b) => a.productId - b.productId);

    const current = normalize(backendItems || []);
    const target = normalize(desired);

    const sameCart =
      current.length === target.length &&
      current.every(
        (item, index) =>
          item.productId === target[index].productId &&
          item.quantity === target[index].quantity
      );

    if (sameCart) {
      return;
    }

    if (current.length > 0) {
      throw new Error(
        'Your saved server cart differs from this cart. Please open your cart and reconcile the items before checkout.'
      );
    }

    for (const item of desired) {
      if (
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new Error(
          'Your cart contains an invalid product or quantity.'
        );
      }

      await addBackendCartItem(
        user.id,
        item.productId,
        item.quantity
      );
    }
  };

  const placeOrder = async () => {
    if (processing) return;

    const nextErrors = validatePayment();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setProcessing(true);

    try {
      await syncBackendCart();

      const order = await createOrder(user.id, {
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          emoji: item.product.emoji,
          bg: item.product.bg,
          size: item.size,
          qty: item.qty,
          price: item.product.price,
        })),
        address: addr,
        paymentMethod: method,
        totals,
      });

      // Clear the cart only after checkout succeeds.
      clear();

      toast(`Order ${order.id} placed successfully!`);

      // Redirect to the product listing page after success.
      navigate('/', { replace: true });
    } catch (error) {
      toast(
        error.message || 'Unable to place your order.',
        'error'
      );
      setProcessing(false);
    }
  };

  const err = (key) =>
    errors[key] ? <small className="err">{errors[key]}</small> : null;

  return (
    <>
      <div className="steps">
        <div className="step step-on">1 Address</div>
        <div className={`step ${step === 2 ? 'step-on' : ''}`}>
          2 Payment
        </div>
      </div>

      <div className="cart-layout">
        <div>
          {step === 1 && (
            <div className="box form-grid">
              <h3 className="span2">Delivery Address</h3>

              <label>
                Full Name
                <input
                  value={addr.name}
                  onChange={setA('name')}
                  className={errors.name ? 'invalid' : ''}
                />
                {err('name')}
              </label>

              <label>
                Mobile Number
                <input
                  value={addr.phone}
                  onChange={setA('phone')}
                  maxLength={10}
                  inputMode="numeric"
                  className={errors.phone ? 'invalid' : ''}
                />
                {err('phone')}
              </label>

              <label>
                Pincode
                <input
                  value={addr.pincode}
                  onChange={setA('pincode')}
                  maxLength={6}
                  inputMode="numeric"
                  className={errors.pincode ? 'invalid' : ''}
                />
                {err('pincode')}
              </label>

              <label>
                City
                <input
                  value={addr.city}
                  onChange={setA('city')}
                  className={errors.city ? 'invalid' : ''}
                />
                {err('city')}
              </label>

              <label className="span2">
                House No., Building, Street, Area
                <input
                  value={addr.line1}
                  onChange={setA('line1')}
                  className={errors.line1 ? 'invalid' : ''}
                />
                {err('line1')}
              </label>

              <label>
                State
                <input
                  value={addr.state}
                  onChange={setA('state')}
                  className={errors.state ? 'invalid' : ''}
                />
                {err('state')}
              </label>

              <div className="span2">
                <button className="btn" onClick={next}>
                  Save Address &amp; Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="box addr-recap">
                <div>
                  <b>Deliver to: {addr.name}</b>
                  <p className="muted">
                    {addr.line1}, {addr.city}, {addr.state} -{' '}
                    {addr.pincode}
                    {' · '}
                    {addr.phone}
                  </p>
                </div>

                <button className="link" onClick={() => setStep(1)}>
                  Change
                </button>
              </div>

              <div className="box">
                <h3>Select Payment Method</h3>

                <div className="methods">
                  {METHODS.map((payment) => (
                    <label
                      key={payment.id}
                      className={`method ${
                        method === payment.id ? 'method-on' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="pm"
                        checked={method === payment.id}
                        onChange={() => {
                          setMethod(payment.id);
                          setErrors({});
                        }}
                      />

                      <span className="m-icon">{payment.icon}</span>

                      <span>
                        <b>{payment.label}</b>
                        <small>{payment.sub}</small>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pay-fields">
                  {method === 'UPI' && (
                    <label>
                      UPI ID
                      <input
                        value={pay.upi}
                        onChange={setP('upi')}
                        placeholder="yourname@upi"
                        className={errors.upi ? 'invalid' : ''}
                      />
                      {err('upi')}
                    </label>
                  )}

                  {method === 'CARD' && (
                    <div className="form-grid">
                      <label className="span2">
                        Card Number
                        <input
                          value={pay.card}
                          inputMode="numeric"
                          maxLength={19}
                          placeholder="1234 5678 9012 3456"
                          className={errors.card ? 'invalid' : ''}
                          onChange={(event) =>
                            setPay((previous) => ({
                              ...previous,
                              card: event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 16)
                                .replace(/(.{4})/g, '$1 ')
                                .trim(),
                            }))
                          }
                        />
                        {err('card')}
                      </label>

                      <label>
                        Expiry
                        <input
                          value={pay.expiry}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={errors.expiry ? 'invalid' : ''}
                          onChange={(event) => {
                            let value = event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 4);

                            if (value.length > 2) {
                              value =
                                value.slice(0, 2) +
                                '/' +
                                value.slice(2);
                            }

                            setPay((previous) => ({
                              ...previous,
                              expiry: value,
                            }));
                          }}
                        />
                        {err('expiry')}
                      </label>

                      <label>
                        CVV
                        <input
                          type="password"
                          value={pay.cvv}
                          maxLength={3}
                          inputMode="numeric"
                          className={errors.cvv ? 'invalid' : ''}
                          onChange={(event) =>
                            setPay((previous) => ({
                              ...previous,
                              cvv: event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 3),
                            }))
                          }
                        />
                        {err('cvv')}
                      </label>

                      <label className="span2">
                        Name on Card
                        <input
                          value={pay.cardName}
                          onChange={setP('cardName')}
                          className={errors.cardName ? 'invalid' : ''}
                        />
                        {err('cardName')}
                      </label>
                    </div>
                  )}

                  {method === 'NETBANKING' && (
                    <label>
                      Choose Bank
                      <select
                        value={pay.bank}
                        onChange={setP('bank')}
                      >
                        {BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {method === 'COD' && (
                    <p className="muted">
                      Pay {money(totals.total)} in cash when your order
                      arrives. Keep exact change handy.
                    </p>
                  )}
                </div>

                <p className="demo-note">
                  🔒 Demo checkout: no real payment is charged, and
                  payment details are not sent to the backend.
                </p>
              </div>
            </>
          )}
        </div>

        <PriceSummary totals={totals}>
          {step === 2 && (
            <button
              className="btn btn-block"
              onClick={placeOrder}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner" /> Processing...
                </>
              ) : method === 'COD' ? (
                'Place Order'
              ) : (
                `Pay ${money(totals.total)}`
              )}
            </button>
          )}
        </PriceSummary>
      </div>
    </>
  );
}
