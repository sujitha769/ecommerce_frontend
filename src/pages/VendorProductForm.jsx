import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../api/client';

const initialForm = {
  name: '',
  category: 'Electronics',
  price: '',
  mrp: '',
  stockQuantity: '0',
  rating: '0',
  reviews: '0',
  description: '',
  emoji: '🛍️',
  bg: ['#e0f2fe', '#bae6fd'],
  sizes: '',
};

const categories = [
  'Women',
  'Men',
  'Kids',
  'Home',
  'Beauty',
  'Electronics',
];

export default function VendorProductForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!image) {
      setError('Please select a product image.');
      return;
    }

    const price = Number(form.price);
    const mrp = Number(form.mrp);
    const stockQuantity = Number(form.stockQuantity);
    const rating = Number(form.rating);
    const reviews = Number(form.reviews);

    if (!Number.isFinite(price) || price <= 0 || mrp < price) {
      setError(
        'Price must be positive, and MRP must be at least the selling price.'
      );
      return;
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError('Available stock must be a non-negative whole number.');
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setError('Rating must be between 0 and 5.');
      return;
    }

    if (!Number.isInteger(reviews) || reviews < 0) {
      setError('Reviews must be a non-negative whole number.');
      return;
    }

    const product = {
      name: form.name.trim(),
      category: form.category,
      price,
      mrp,
      stockQuantity,
      rating,
      reviews,
      description: form.description.trim(),
      emoji: form.emoji,
      bg: form.bg,
      sizes: form.sizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean),
    };

    try {
      setBusy(true);

      const created = await createProduct(product, image);

      setSuccess(`"${created.name}" was added successfully.`);
      setForm(initialForm);
      setImage(null);
      event.target.reset();
    } catch (err) {
      setError(err.message || 'Unable to create product.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="vendor-page">
      <div className="vendor-heading">
        <div>
          <p className="vendor-eyebrow">SHOPEASY CATALOGUE</p>
          <h1>Add a new product</h1>
          <p>
            Add product details, opening stock, and an image
            to publish a product in the catalogue.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/')}
        >
          View customer page
        </button>
      </div>

      <form className="vendor-form box" onSubmit={handleSubmit}>
        {error && <div className="err">{error}</div>}

        {success && (
          <div className="success">
            <div>
              <b>Product created</b>
              <p>{success}</p>
              <button
                type="button"
                className="link"
                onClick={() => navigate('/')}
              >
                View catalogue →
              </button>
            </div>
          </div>
        )}

        <div className="form-grid">
          <label>
            Product name *
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Wireless Earbuds"
            />
          </label>

          <label>
            Category *
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Selling price (₹) *
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </label>

          <label>
            MRP (₹) *
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.mrp}
              onChange={(e) => update('mrp', e.target.value)}
            />
          </label>

          <label>
            Available stock *
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={(e) => update('stockQuantity', e.target.value)}
              placeholder="e.g. 50"
            />
          </label>

          <label>
            Rating (0–5) *
            <input
              required
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => update('rating', e.target.value)}
            />
          </label>

          <label>
            Number of reviews *
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.reviews}
              onChange={(e) => update('reviews', e.target.value)}
            />
          </label>

          <label>
            Emoji
            <input
              value={form.emoji}
              onChange={(e) => update('emoji', e.target.value)}
              maxLength={10}
            />
          </label>

          <label>
            Sizes (comma separated)
            <input
              value={form.sizes}
              onChange={(e) => update('sizes', e.target.value)}
              placeholder="S, M, L, XL or Free"
            />
          </label>

          <label>
            Background color 1
            <input
              type="color"
              value={form.bg[0]}
              onChange={(e) =>
                update('bg', [e.target.value, form.bg[1]])
              }
            />
          </label>

          <label>
            Background color 2
            <input
              type="color"
              value={form.bg[1]}
              onChange={(e) =>
                update('bg', [form.bg[0], e.target.value])
              }
            />
          </label>

          <label className="span2">
            Description *
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the product..."
            />
          </label>

          <label className="span2">
            Product image *
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
            />
          </label>
        </div>

        <button className="btn btn-block" disabled={busy}>
          {busy ? 'Uploading...' : 'Add product'}
        </button>
      </form>
    </section>
  );
}
