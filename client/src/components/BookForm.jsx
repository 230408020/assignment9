import { useState } from 'react';
import { GENRES } from './Filters.jsx';

const EMPTY = { title: '', author: '', year: '', genre: 'fiction', read: false, rating: '' };

function toForm(book) {
  if (!book) return EMPTY;
  return { ...book, year: String(book.year), rating: book.rating === null ? '' : String(book.rating) };
}

// Used both for adding (POST) and editing (PUT). The parent decides which.
export default function BookForm({ initialBook, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(initialBook));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const book = {
      title: form.title,
      author: form.author,
      year: Number(form.year),
      genre: form.genre,
      read: form.read,
      rating: form.rating === '' ? null : Number(form.rating),
    };
    try {
      await onSubmit(book);
      if (!initialBook) setForm(EMPTY);
    } catch (err) {
      setError(err.message); // message comes from the server
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{initialBook ? `Edit "${initialBook.title}"` : 'Add a book'}</h2>
      <input placeholder="Title" value={form.title} onChange={update('title')} required maxLength={100} />
      <input placeholder="Author" value={form.author} onChange={update('author')} required maxLength={100} />
      <input type="number" placeholder="Year" value={form.year} onChange={update('year')} required />
      <select value={form.genre} onChange={update('genre')}>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <label>
        <input type="checkbox" checked={form.read} onChange={update('read')} /> Read
      </label>
      <select value={form.rating} onChange={update('rating')}>
        <option value="">No rating</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n} ★</option>
        ))}
      </select>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : initialBook ? 'Save changes' : 'Add book'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={submitting}>Cancel</button>
      )}
      {error && <p className="error">{error}</p>}
    </form>
  );
}
