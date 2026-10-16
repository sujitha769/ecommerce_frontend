import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="logo">Shop<span>Easy</span></Link>

        <form className="search" onSubmit={submit}>
          <span className="search-icon">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try Saree, Kurti, Earbuds..." />
        </form>

        <nav className="nav-links">
          {user ? (
            <div className="profile" onMouseLeave={() => setMenu(false)}>
              <button className="nav-btn" onClick={() => setMenu((m) => !m)} onMouseEnter={() => setMenu(true)}>
                <span className="avatar">{user.name[0].toUpperCase()}</span>
                <span className="hide-sm">{user.name.split(' ')[0]}</span>
              </button>
              {menu && (
                <div className="dropdown">
                  <div className="dd-head">
                    <b>{user.name}</b>
                    <small>{user.email}</small>
                  </div>
                  <Link to="/orders" onClick={() => setMenu(false)}>📦 My Orders</Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenu(false);
                      navigate('/');
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="nav-btn">Sign In</NavLink>
              <NavLink to="/register" className="nav-btn nav-cta">Register</NavLink>
            </>
          )}
          <NavLink to="/orders" className="nav-btn hide-sm">Orders</NavLink>
          <NavLink to="/cart" className="nav-btn cart-btn">
            🛒 <span className="hide-sm">Cart</span>
            {totals.count > 0 && <em className="badge">{totals.count}</em>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
