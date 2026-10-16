import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart, money } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../api/client';
import PriceSummary from '../components/PriceSummary';

const METHODS = [
  { id: 'UPI', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: '📱' },
  { id: 'CARD', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
  { id: 'NETBANKING', label: 'Net Banking', sub: 'All major banks', icon: '🏦' },
  { id: 'COD', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: '💵' },
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Canara Bank', 'Bank of Baroda'];

export default function Checkout() {
  const { user } = useAuth();
  const { items, totals, clear } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1 = address, 2 = payment
  const [addr, setAddr] = useState({ name: user.name, phone: '', pincode: '', line1: '', city: '', state: '' });
  const [method, setMethod] = useState('UPI');
  const [pay, setPay] = useState({ upi: '', card: '', expiry: '', cvv: '', cardName: '', bank: BANKS[0] });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  if (items.length === 0 && !processing) return <Navigate to="/cart" replace />;

  const setA = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });
  const setP = (k) => (e) => setPay({ ...pay, [k]: e.target.value });

  const validateAddress = () => {
    const e = {};
    if (addr.name.trim().length < 2) e.name = 'Enter name';
    if (!/^[6-9]\d{9}$/.test(addr.phone)) e.phone = 'Enter valid 10 digit number';
    if (!/^\d{6}$/.test(addr.pincode)) e.pincode = 'Enter valid 6 digit pincode';
    if (addr.line1.trim().length < 5) e.line1 = 'Enter house no, street, area';
    if (!addr.city.trim()) e.city = 'Enter city';
    if (!addr.state.trim()) e.state = 'Enter state';
    return e;
  };

  const validatePayment = () => {
    const e = {};
    if (method === 'UPI' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(pay.upi)) e.upi = 'Enter valid UPI ID (name@bank)';
    if (method === 'CARD') {
      if (pay.card.replace(/\s/g, '').length !== 16) e.card = 'Enter 16 digit card number';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(pay.expiry)) e.expiry = 'Use MM/YY';
      if (!/^\d{3}$/.test(pay.cvv)) e.cvv = '3 digit CVV';
      if (pay.cardName.trim().length < 2) e.cardName = 'Name on card';
    }
    return e;
  };

  const next = () => {
    const e = validateAddress();
    setErrors(e);
    if (!Object.keys(e).length) setStep(2);
  };

  const placeOrder = async () => {
    const e = validatePayment();
    setErrors(e);
    if (Object.keys(e).length) return;
    setProcessing(true);
    try {
      const order = await createOrder(user.id, {
        items: items.map((i) => ({ productId: i.product.id, name: i.product.name, emoji: i.product.emoji, bg: i.product.bg, size: i.size, qty: i.qty, price: i.product.price })),
        address: addr,
        paymentMethod: method,
        totals,
      });
      clear();
      toast(`Order ${order.id} placed successfully!`);
      navigate('/orders', { replace: true, state: { placed: order.id } });
    } catch (err) {
      toast(err.message, 'error');
      setProcessing(false);
    }
  };

  const err = (k) => errors[k] && <small className="err">{errors[k]}</small>;

  return (
    <>
      <div className="steps">
        <div className="step step-on">1 Address</div>
        <div className={`step ${step === 2 ? 'step-on' : ''}`}>2 Payment</div>
      </div>

      <div className="cart-layout">
        <div>
          {step === 1 && (
            <div className="box form-grid">
              <h3 className="span2">Delivery Address</h3>
              <label>Full Name<input value={addr.name} onChange={setA('name')} className={errors.name ? 'invalid' : ''} />{err('name')}</label>
              <label>Mobile Number<input value={addr.phone} onChange={setA('phone')} maxLength={10} inputMode="numeric" className={errors.phone ? 'invalid' : ''} />{err('phone')}</label>
              <label>Pincode<input value={addr.pincode} onChange={setA('pincode')} maxLength={6} inputMode="numeric" className={errors.pincode ? 'invalid' : ''} />{err('pincode')}</label>
              <label>City<input value={addr.city} onChange={setA('city')} className={errors.city ? 'invalid' : ''} />{err('city')}</label>
              <label className="span2">House No., Building, Street, Area<input value={addr.line1} onChange={setA('line1')} className={errors.line1 ? 'invalid' : ''} />{err('line1')}</label>
              <label>State<input value={addr.state} onChange={setA('state')} className={errors.state ? 'invalid' : ''} />{err('state')}</label>
              <div className="span2"><button className="btn" onClick={next}>Save Address & Continue</button></div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="box addr-recap">
                <div>
                  <b>Deliver to: {addr.name}</b>
                  <p className="muted">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode} · {addr.phone}</p>
                </div>
                <button className="link" onClick={() => setStep(1)}>Change</button>
              </div>

              <div className="box">
                <h3>Select Payment Method</h3>
                <div className="methods">
                  {METHODS.map((m) => (
                    <label key={m.id} className={`method ${method === m.id ? 'method-on' : ''}`}>
                      <input type="radio" name="pm" checked={method === m.id} onChange={() => { setMethod(m.id); setErrors({}); }} />
                      <span className="m-icon">{m.icon}</span>
                      <span><b>{m.label}</b><small>{m.sub}</small></span>
                    </label>
                  ))}
                </div>

                <div className="pay-fields">
                  {method === 'UPI' && (
                    <label>UPI ID<input value={pay.upi} onChange={setP('upi')} placeholder="yourname@upi" className={errors.upi ? 'invalid' : ''} />{err('upi')}</label>
                  )}
                  {method === 'CARD' && (
                    <div className="form-grid">
                      <label className="span2">Card Number
                        <input value={pay.card} inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" className={errors.card ? 'invalid' : ''}
                          onChange={(e) => setPay({ ...pay, card: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })} />
                        {err('card')}
                      </label>
                      <label>Expiry<input value={pay.expiry} placeholder="MM/YY" maxLength={5} className={errors.expiry ? 'invalid' : ''}
                        onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); setPay({ ...pay, expiry: v }); }} />{err('expiry')}</label>
                      <label>CVV<input type="password" value={pay.cvv} maxLength={3} inputMode="numeric" className={errors.cvv ? 'invalid' : ''}
                        onChange={(e) => setPay({ ...pay, cvv: e.target.value.replace(/\D/g, '') })} />{err('cvv')}</label>
                      <label className="span2">Name on Card<input value={pay.cardName} onChange={setP('cardName')} className={errors.cardName ? 'invalid' : ''} />{err('cardName')}</label>
                    </div>
                  )}
                  {method === 'NETBANKING' && (
                    <label>Choose Bank<select value={pay.bank} onChange={setP('bank')}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
                  )}
                  {method === 'COD' && <p className="muted">Pay {money(totals.total)} in cash when your order arrives. Keep exact change handy.</p>}
                </div>
                <p className="demo-note">🔒 Demo checkout: no real payment is charged and no card data is stored.</p>
              </div>
            </>
          )}
        </div>

        <PriceSummary totals={totals}>
          {step === 2 && (
            <button className="btn btn-block" onClick={placeOrder} disabled={processing}>
              {processing ? <><span className="spinner" /> Processing...</> : method === 'COD' ? 'Place Order' : `Pay ${money(totals.total)}`}
            </button>
          )}
        </PriceSummary>
      </div>
    </>
  );
}
