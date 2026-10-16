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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProducts({ q, category }).then((data) => {
      if (alive) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [q, category]);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'low') return a.price - b.price;
    if (sort === 'high') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  const setCat = (c) => {
    const next = new URLSearchParams(params);
    c === 'All' ? next.delete('cat') : next.set('cat', c);
    setParams(next);
  };

  return (
    <>
      {!q && category === 'All' && (
        <section className="hero">
          <div>
            <h1>Lowest Prices.<br />Free Delivery.</h1>
            <p>Shop fashion, home, beauty & electronics. Cash on Delivery available.</p>
          </div>
          <div className="hero-emojis">🛍️ 👗 👟 🎧</div>
        </section>
      )}

      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${c === category ? 'chip-on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="toolbar">
        <h2>{q ? `Results for "${q}"` : category === 'All' ? 'Products For You' : category}</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card skeleton" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty"><div className="empty-emoji">🔎</div><h3>No products found</h3><p>Try a different search or category.</p></div>
      ) : (
        <div className="grid">{sorted.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </>
  );
}
