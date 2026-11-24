const RESET = { q: '', genre: '', read: '', sort: '', order: 'asc' };
const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

export default function Filters({ filters, onChange }) {
  const update = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search title or author"
        value={filters.q}
        onChange={update('q')}
      />
      <select value={filters.genre} onChange={update('genre')}>
        <option value="">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select value={filters.read} onChange={update('read')}>
        <option value="">Read and unread</option>
        <option value="true">Read</option>
        <option value="false">Unread</option>
      </select>
      <select value={filters.sort} onChange={update('sort')}>
        <option value="">Sort by id</option>
        <option value="title">Title</option>
        <option value="author">Author</option>
        <option value="year">Year</option>
        <option value="rating">Rating</option>
      </select>
      <select value={filters.order} onChange={update('order')}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
      <button type="button" onClick={() => onChange(RESET)}>Reset</button>
    </div>
  );
}

export { GENRES };
