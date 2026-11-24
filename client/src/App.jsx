import { useEffect, useState, useCallback } from 'react';
import { listBooks, createBook, replaceBook, patchBook, deleteBook, getStats } from './api/books.js';
import Filters from './components/Filters.jsx';
import BookForm from './components/BookForm.jsx';
import BookList from './components/BookList.jsx';
import StatsPanel from './components/StatsPanel.jsx';

const INITIAL_FILTERS = { q: '', genre: '', read: '', sort: '', order: 'asc' };

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [editing, setEditing] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Load the list from the server whenever filters change or after a change.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    listBooks(filters, controller.signal)
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return; // a newer request replaced this one
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [filters, reloadToken]);

  const loadStats = useCallback(async () => {
    try {
      setStatsError('');
      setStats(await getStats());
    } catch (err) {
      setStatsError(err.message);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Called only after the server has confirmed a change.
  function afterChange() {
    setReloadToken((t) => t + 1);
    loadStats();
  }

  async function handleCreate(book) {
    await createBook(book);
    afterChange();
  }

  async function handleReplace(book) {
    const updated = await replaceBook(editing.id, book);
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditing(null);
    afterChange();
  }

  async function handlePatch(id, changes) {
    const updated = await patchBook(id, changes);
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    afterChange();
  }

  async function handleDelete(id) {
    await deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (editing && editing.id === id) setEditing(null);
    afterChange();
  }

  return (
    <main>
      <h1>Reading List</h1>
      <StatsPanel stats={stats} error={statsError} />
      {editing ? (
        <BookForm
          key={editing.id}
          initialBook={editing}
          onSubmit={handleReplace}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <BookForm onSubmit={handleCreate} />
      )}
      <Filters filters={filters} onChange={setFilters} />
      <BookList
        books={books}
        loading={loading}
        error={error}
        onEdit={setEditing}
        onPatch={handlePatch}
        onDelete={handleDelete}
      />
    </main>
  );
}
