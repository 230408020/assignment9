export default function StatsPanel({ stats, error }) {
  if (error) return <p className="error">Could not load statistics: {error}</p>;
  if (!stats) return <p>Loading statistics…</p>;

  return (
    <section className="stats">
      <h2>Statistics</h2>
      <p>
        Total: {stats.total} · Read: {stats.read} · Unread: {stats.unread} · Average rating:{' '}
        {stats.averageRating === null ? '–' : stats.averageRating}
      </p>
      <p>
        {Object.entries(stats.byGenre).map(([genre, count]) => `${genre}: ${count}`).join(' · ')}
      </p>
    </section>
  );
}
