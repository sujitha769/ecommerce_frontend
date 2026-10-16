import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Rules user-service validation tho match avvali
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your full name';
    else if (form.name.trim().length > 100) e.name = 'Name cannot exceed 100 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    else if (form.email.trim().length > 150) e.email = 'Email cannot exceed 150 characters';
    if (form.password.length < 8 || form.password.length > 72) e.password = 'Password must contain 8 to 72 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast('Account created. Happy shopping!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (k, label, props = {}) => (
    <label>{label}
      <input value={form[k]} onChange={set(k)} className={errors[k] ? 'invalid' : ''} {...props} />
      {errors[k] && <small className="err">{errors[k]}</small>}
    </label>
  );

  return (
    <div className="auth">
      <div className="auth-art">
        <h2>Join ShopEasy 🎉</h2>
        <p>Lowest prices, free delivery and cash on delivery on every order.</p>
        <div className="auth-emoji">👗 👟 🎧</div>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <h1>Create Account</h1>
        {serverError && <div className="alert">{serverError}</div>}
        {field('name', 'Full Name', { placeholder: 'Your name', autoFocus: true })}
        {field('email', 'Email', { type: 'email', placeholder: 'you@example.com' })}
        {field('password', 'Password', { type: 'password', placeholder: 'Min 8 characters' })}
        {field('confirm', 'Confirm Password', { type: 'password', placeholder: 'Re-enter password' })}
        <button className="btn btn-block" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        <p className="switch">Already have an account? <Link to="/login" state={location.state}>Sign In</Link></p>
      </form>
    </div>
  );
}
