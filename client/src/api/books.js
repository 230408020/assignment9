// All network access lives here. Components never call fetch or build URLs.

const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, { method = 'GET', body, signal } = {}) {
  const options = { method, signal, headers: {} };

  // Only send Content-Type when there actually is a body.
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  // 204 No Content has no body to parse.
  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data && data.error ? data.error : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function listBooks(filters = {}, signal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined && value !== null) params.set(key, value);
  }
  const query = params.toString();
  return request(`/api/books${query ? `?${query}` : ''}`, { signal });
}

export function getBook(id) {
  return request(`/api/books/${encodeURIComponent(id)}`);
}

export function createBook(book) {
  return request('/api/books', { method: 'POST', body: book });
}

export function replaceBook(id, book) {
  return request(`/api/books/${encodeURIComponent(id)}`, { method: 'PUT', body: book });
}

export function patchBook(id, changes) {
  return request(`/api/books/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
}

export function deleteBook(id) {
  return request(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function getStats() {
  return request('/api/stats');
}
