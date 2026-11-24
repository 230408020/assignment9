import express from 'express';
import cors from 'cors';
import * as store from './booksStore.js';
import { parseId, validateBook, pickBookFields, validateQuery } from './validate.js';

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Simple request log (useful for the CORS experiment).
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Two books may not share the same title and author (case-insensitive).
function isDuplicate(allBooks, book, ignoreId = null) {
  const title = book.title.toLowerCase();
  const author = book.author.toLowerCase();
  return allBooks.some(
    (b) => b.id !== ignoreId && b.title.toLowerCase() === title && b.author.toLowerCase() === author,
  );
}

function compareBooks(a, b, field) {
  if (field === 'title' || field === 'author') {
    return a[field].localeCompare(b[field], undefined, { sensitivity: 'base' });
  }
  return a[field] - b[field];
}

// GET /api/books - list with filters, search, sorting and pagination
app.get('/api/books', async (req, res) => {
  const { error, value: opts } = validateQuery(req.query);
  if (error) return res.status(400).json({ error });

  let result = await store.getAll();

  if (opts.genre !== undefined) result = result.filter((b) => b.genre === opts.genre);
  if (opts.read !== undefined) result = result.filter((b) => b.read === opts.read);
  if (opts.q) {
    result = result.filter(
      (b) => b.title.toLowerCase().includes(opts.q) || b.author.toLowerCase().includes(opts.q),
    );
  }

  const direction = opts.order === 'desc' ? -1 : 1;
  if (opts.sort === 'rating') {
    const rated = result.filter((b) => b.rating !== null);
    const unrated = result.filter((b) => b.rating === null);
    const sortedRated = [...rated].sort((a, b) => direction * (a.rating - b.rating) || a.id - b.id);
    result = [...sortedRated, ...unrated]; // unrated books always last
  } else {
    result = [...result].sort((a, b) => direction * compareBooks(a, b, opts.sort) || a.id - b.id);
  }

  const start = (opts.page - 1) * opts.limit;
  return res.status(200).json(result.slice(start, start + opts.limit));
});

// GET /api/books/:id
app.get('/api/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  const book = await store.getById(id);
  if (!book) return res.status(404).json({ error: `Book with id ${id} not found` });

  return res.status(200).json(book);
});

// POST /api/books
app.post('/api/books', async (req, res) => {
  const { error, value } = validateBook(req.body);
  if (error) return res.status(400).json({ error });

  const all = await store.getAll();
  if (isDuplicate(all, value)) {
    return res.status(409).json({ error: 'A book with this title and author already exists' });
  }

  const book = await store.create(value);
  return res.status(201).location(`/api/books/${book.id}`).json(book);
});

// PUT /api/books/:id - full replacement
app.put('/api/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  const { error, value } = validateBook(req.body);
  if (error) return res.status(400).json({ error });

  const existing = await store.getById(id);
  if (!existing) return res.status(404).json({ error: `Book with id ${id} not found` });

  const all = await store.getAll();
  if (isDuplicate(all, value, id)) {
    return res.status(409).json({ error: 'A book with this title and author already exists' });
  }

  const updated = await store.replace(id, value);
  return res.status(200).json(updated);
});

// PATCH /api/books/:id - partial update, merged book must still be valid
app.patch('/api/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const existing = await store.getById(id);
  if (!existing) return res.status(404).json({ error: `Book with id ${id} not found` });

  const merged = { ...existing, ...pickBookFields(req.body) };
  const { error, value } = validateBook(merged);
  if (error) return res.status(400).json({ error });

  const all = await store.getAll();
  if (isDuplicate(all, value, id)) {
    return res.status(409).json({ error: 'A book with this title and author already exists' });
  }

  const updated = await store.replace(id, value);
  return res.status(200).json(updated);
});

// DELETE /api/books/:id
app.delete('/api/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  const removed = await store.remove(id);
  if (!removed) return res.status(404).json({ error: `Book with id ${id} not found` });

  return res.status(204).end();
});

// GET /api/stats - always computed from the current data
app.get('/api/stats', async (req, res) => {
  const all = await store.getAll();
  const readCount = all.filter((b) => b.read).length;
  const rated = all.filter((b) => b.rating !== null);
  const averageRating = rated.length === 0
    ? null
    : Math.round((rated.reduce((sum, b) => sum + b.rating, 0) / rated.length) * 10) / 10;
  const byGenre = all.reduce(
    (acc, b) => ({ ...acc, [b.genre]: (acc[b.genre] ?? 0) + 1 }),
    {},
  );

  return res.status(200).json({
    total: all.length,
    read: readCount,
    unread: all.length - readCount,
    averageRating,
    byGenre,
  });
});

// Deliberate crash route to prove the error middleware works (documented in README).
app.get('/api/crash', async () => {
  throw new Error('Deliberate crash for testing the error handler');
});

// 404 fallback for anything under /api that matched no route (no "*" wildcard)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error-handling middleware (four parameters), registered after all routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});
