// In-memory data store. Every function is async and never mutates
// the existing array or book objects: it always builds new ones.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SIMULATED_LATENCY_MS = 50;

let books = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'fantasy', read: true, rating: 5 },
  { id: 2, title: '1984', author: 'George Orwell', year: 1949, genre: 'fiction', read: true, rating: 4 },
  { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', year: 1988, genre: 'science', read: false, rating: null },
  { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, genre: 'history', read: true, rating: 4 },
  { id: 5, title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'fiction', read: false, rating: null },
  { id: 6, title: 'The Name of the Wind', author: 'Patrick Rothfuss', year: 2007, genre: 'fantasy', read: true, rating: 5 },
];

let nextId = 7;

export async function getAll() {
  await delay(SIMULATED_LATENCY_MS);
  return [...books];
}

export async function getById(id) {
  await delay(SIMULATED_LATENCY_MS);
  return books.find((b) => b.id === id) ?? null;
}

export async function create(data) {
  await delay(SIMULATED_LATENCY_MS);
  const book = { ...data, id: nextId };
  nextId += 1;
  books = [...books, book];
  return book;
}

export async function replace(id, data) {
  await delay(SIMULATED_LATENCY_MS);
  const exists = books.some((b) => b.id === id);
  if (!exists) return null;
  const updated = { ...data, id };
  books = books.map((b) => (b.id === id ? updated : b));
  return updated;
}

export async function remove(id) {
  await delay(SIMULATED_LATENCY_MS);
  const exists = books.some((b) => b.id === id);
  if (!exists) return false;
  books = books.filter((b) => b.id !== id);
  return true;
}
