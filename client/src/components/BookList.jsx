import { useState } from 'react';

function BookItem({ book, onEdit, onPatch, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <li className="book">
      <div>
        <strong>{book.title}</strong> by {book.author} ({book.year}) · <em>{book.genre}</em>
        {book.rating !== null && <span> · {'★'.repeat(book.rating)}</span>}
      </div>
      <div className="actions">
        <label>
          <input
            type="checkbox"
            checked={book.read}
            disabled={busy}
            onChange={() => run(() => onPatch(book.id, { read: !book.read }))}
          />{' '}
          Read
        </label>
        <select
          value={book.rating ?? ''}
          disabled={busy}
          onChange={(e) =>
            run(() => onPatch(book.id, { rating: e.target.value === '' ? null : Number(e.target.value) }))
          }
        >
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
        <button type="button" disabled={busy} onClick={() => onEdit(book)}>Edit</button>
        <button type="button" disabled={busy} onClick={() => run(() => onDelete(book.id))}>Delete</button>
      </div>
      {error && <p className="error">{error}</p>}
    </li>
  );
}

export default function BookList({ books, loading, error, onEdit, onPatch, onDelete }) {
  if (loading) return <p>Loading books…</p>;
  if (error) return <p className="error">Could not load books: {error}</p>;
  if (books.length === 0) return <p>No books match your filters.</p>;

  return (
    <ul className="book-list">
      {books.map((book) => (
        <BookItem key={book.id} book={book} onEdit={onEdit} onPatch={onPatch} onDelete={onDelete} />
      ))}
    </ul>
  );
}
