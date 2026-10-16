import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address');
    if (!form.password) return setError('Enter your password');
    setLoading(true);
    try {
      await login(form);
      toast('Welcome back!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <h2>Welcome back 👋</h2>
        <p>Sign in to see your cart, track orders and shop at the lowest prices.</p>
        <div className="auth-emoji">🛍️</div>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <h1>Sign In</h1>
        {error && <div className="alert">{error}</div>}
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoFocus />
        </label>
        <label>Password
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Enter password" />
            <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </label>
        <button className="btn btn-block" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        <p className="switch">New to ShopEasy? <Link to="/register" state={location.state}>Create account</Link></p>
      </form>
    </div>
  );
}
