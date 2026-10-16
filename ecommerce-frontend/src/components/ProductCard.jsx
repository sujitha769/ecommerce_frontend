import { Link } from 'react-router-dom';
import { money } from '../context/CartContext';

export const ProductImage = ({ product, size = 'card' }) => (
  <div className={`pimg pimg-${size}`} style={{ background: `linear-gradient(135deg, ${product.bg[0]}, ${product.bg[1]})` }}>
    <span>{product.emoji}</span>
  </div>
);

export default function ProductCard({ product }) {
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  return (
    <Link to={`/product/${product.id}`} className="card">
      <ProductImage product={product} />
      <div className="card-body">
        <p className="card-name">{product.name}</p>
        <div className="price-row">
          <b className="price">{money(product.price)}</b>
          <s className="mrp">{money(product.mrp)}</s>
          <span className="off">{off}% off</span>
        </div>
        <span className="free">Free Delivery</span>
        <div className="rate-row">
          <span className={`rating ${product.rating < 4.1 ? 'rating-mid' : ''}`}>{product.rating} ★</span>
          <small>{product.reviews.toLocaleString('en-IN')} Reviews</small>
        </div>
      </div>
    </Link>
  );
}
