// Hand-written validation (no schema libraries allowed).

export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];
const SORT_FIELDS = ['title', 'author', 'year', 'rating'];
const ORDERS = ['asc', 'desc'];

// Returns a positive integer, or null if the value is not one.
export function parseId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

// Validates a complete book. Returns { error } or { value } with cleaned fields.
export function validateBook(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Request body must be a JSON object' };
  }
  const { title, author, year, genre } = input;
  const read = input.read === undefined ? false : input.read;
  const rating = input.rating === undefined ? null : input.rating;

  if (typeof title !== 'string') return { error: 'title is required and must be a string' };
  const cleanTitle = title.trim();
  if (cleanTitle.length < 1 || cleanTitle.length > 100) {
    return { error: 'title must be 1 to 100 characters after trimming' };
  }

  if (typeof author !== 'string') return { error: 'author is required and must be a string' };
  const cleanAuthor = author.trim();
  if (cleanAuthor.length < 1 || cleanAuthor.length > 100) {
    return { error: 'author must be 1 to 100 characters after trimming' };
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
    return { error: `year must be an integer between 1000 and ${currentYear}` };
  }

  if (!GENRES.includes(genre)) {
    return { error: `genre must be one of: ${GENRES.join(', ')}` };
  }

  if (typeof read !== 'boolean') return { error: 'read must be a boolean' };

  if (rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'rating must be an integer from 1 to 5, or null' };
    }
    if (!read) return { error: 'rating is allowed only when read is true' };
  }

  return {
    value: { title: cleanTitle, author: cleanAuthor, year, genre, read, rating },
  };
}

// Picks only the known fields from a PATCH body (unknown fields are ignored).
export function pickBookFields(input) {
  const allowed = ['title', 'author', 'year', 'genre', 'read', 'rating'];
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => allowed.includes(key)),
  );
}

// Validates the query string of GET /api/books.
export function validateQuery(query) {
  const known = ['genre', 'read', 'q', 'sort', 'order', 'limit', 'page'];

  for (const [key, value] of Object.entries(query)) {
    if (!known.includes(key)) return { error: `Unknown query parameter: ${key}` };
    if (typeof value !== 'string') {
      return { error: `Query parameter "${key}" must appear only once` };
    }
  }

  const options = { q: '', sort: 'id', order: 'asc', limit: 50, page: 1 };

  if (query.genre !== undefined) {
    if (!GENRES.includes(query.genre)) {
      return { error: `genre must be one of: ${GENRES.join(', ')}` };
    }
    options.genre = query.genre;
  }

  if (query.read !== undefined) {
    if (query.read !== 'true' && query.read !== 'false') {
      return { error: 'read must be "true" or "false"' };
    }
    options.read = query.read === 'true';
  }

  if (query.q !== undefined) options.q = query.q.trim().toLowerCase();

  if (query.sort !== undefined) {
    if (!SORT_FIELDS.includes(query.sort)) {
      return { error: `sort must be one of: ${SORT_FIELDS.join(', ')}` };
    }
    options.sort = query.sort;
  }

  if (query.order !== undefined) {
    if (!ORDERS.includes(query.order)) return { error: 'order must be "asc" or "desc"' };
    options.order = query.order;
  }

  if (query.limit !== undefined) {
    const limit = parseId(query.limit);
    if (limit === null || limit > 50) return { error: 'limit must be an integer from 1 to 50' };
    options.limit = limit;
  }

  if (query.page !== undefined) {
    const page = parseId(query.page);
    if (page === null) return { error: 'page must be a positive integer' };
    options.page = page;
  }

  return { value: options };
}
