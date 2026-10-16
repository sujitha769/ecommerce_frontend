import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProduct } from '../api/client';
import { ProductImage } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart, money } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    setProduct(null);
    fetchProduct(id).then((p) => {
      setProduct(p);
      setSize(p.sizes.length === 1 ? p.sizes[0] : '');
    }).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="empty"><h3>{error}</h3><Link to="/" className="btn">Back to shop</Link></div>;
  if (!product) return <div className="detail"><div className="skeleton big" /><div className="skeleton big" /></div>;

  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const guard = () => {
    if (!user) {
      toast('Please sign in to continue', 'error');
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return false;
    }
    if (!size) {
      toast('Please select a size', 'error');
      return false;
    }
    return true;
  };

  const add = () => {
    if (!guard()) return;
    addItem(product, size);
    toast('Added to cart');
  };

  const buyNow = () => {
    if (!guard()) return;
    addItem(product, size);
    navigate('/cart');
  };

  return (
    <div className="detail">
      <div className="detail-left">
        <ProductImage product={product} size="big" />
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={add}>🛒 Add to Cart</button>
          <button className="btn" onClick={buyNow}>⚡ Buy Now</button>
        </div>
      </div>

      <div className="detail-right">
        <div className="box">
          <p className="breadcrumb"><Link to="/">Home</Link> / {product.category}</p>
          <h1>{product.name}</h1>
          <div className="price-row big-price">
            <b className="price">{money(product.price)}</b>
            <s className="mrp">{money(product.mrp)}</s>
            <span className="off">{off}% off</span>
          </div>
          <span className="free">Free Delivery</span>
          <div className="rate-row">
            <span className="rating">{product.rating} ★</span>
            <small>{product.reviews.toLocaleString('en-IN')} Ratings</small>
          </div>
        </div>

        {!(product.sizes.length === 1 && product.sizes[0] === 'Free') && (
          <div className="box">
            <h3>Select Size</h3>
            <div className="sizes">
              {product.sizes.map((s) => (
                <button key={s} className={`size ${s === size ? 'size-on' : ''}`} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="box">
          <h3>Product Details</h3>
          <p className="muted">{product.description}</p>
          <ul className="perks">
            <li>✔ Cash on Delivery available</li>
            <li>✔ 7 days easy returns</li>
            <li>✔ Free delivery on all orders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
