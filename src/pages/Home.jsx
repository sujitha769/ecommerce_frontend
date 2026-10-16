
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../api/client';
import { CATEGORIES } from '../data/products';

export default function Home() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const category = params.get('cat') || 'All';

  const [sort, setSort] = useState('relevance');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchProducts({ q, category });

        if (alive) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (alive) {
          setProducts([]);
          setError(err.message || 'Unable to load products.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      alive = false;
    };
  }, [q, category]);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'low') return Number(a.price) - Number(b.price);
    if (sort === 'high') return Number(b.price) - Number(a.price);
    if (sort === 'rating') return Number(b.rating) - Number(a.rating);
    return 0;
  });

  const setCat = (value) => {
    const next = new URLSearchParams(params);

    if (value === 'All') next.delete('cat');
    else next.set('cat', value);

    setParams(next);
  };

  return (
    <>
      {!q && category === 'All' && (
        <section className="hero">
          <div>
            <h1>
              Lowest Prices.
              <br />
              Free Delivery.
            </h1>
            <p>
              Shop fashion, home, beauty & electronics.
              Cash on Delivery available.
            </p>
          </div>
          <div className="hero-emojis">🛍️ 👗 👟 🎧</div>
        </section>
      )}

      <div className="chips">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            className={`chip ${item === category ? 'chip-on' : ''}`}
            onClick={() => setCat(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <h2>
          {q
            ? `Results for "${q}"`
            : category === 'All'
              ? 'Products For You'
              : category}
        </h2>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="empty">
          <div className="empty-emoji">⚠️</div>
          <h3>Couldn't load products</h3>
          <p>{error}</p>
          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🔎</div>
          <h3>No products found</h3>
          <p>Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
