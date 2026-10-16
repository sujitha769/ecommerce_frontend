
import { Link } from 'react-router-dom';
import { money } from '../context/CartContext';

export const ProductImage = ({ product, size = 'card' }) => (
  <div
    className={`pimg pimg-${size}`}
    style={{
      background:
        Array.isArray(product.bg) && product.bg.length >= 2
          ? `linear-gradient(135deg, ${product.bg[0]}, ${product.bg[1]})`
          : '#f3f4f6',
    }}
  >
    {product.imageUrl ? (
      <img
        src={product.imageUrl}
        alt={product.name}
        className="product-photo"
      />
    ) : (
      <span>{product.emoji || '🛍️'}</span>
    )}
  </div>
);

export default function ProductCard({ product }) {
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || price;
  const rating = Number(product.rating) || 0;
  const reviews = Number(product.reviews) || 0;
  const discount =
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className="card">
      <ProductImage product={product} />

      <div className="card-body">
        <p className="card-name">{product.name}</p>

        <div className="price-row">
          <b className="price">{money(price)}</b>
          {mrp > price && <s className="mrp">{money(mrp)}</s>}
          {discount > 0 && (
            <span className="off">{discount}% off</span>
          )}
        </div>

        <span className="free">Free Delivery</span>

        <div className="rate-row">
          <span className={`rating ${rating < 4.1 ? 'rating-mid' : ''}`}>
            {rating.toFixed(1)} ★
          </span>
          <small>{reviews.toLocaleString('en-IN')} Reviews</small>
        </div>
      </div>
    </Link>
  );
}
