// Sort-by dropdown. Calls onChange with "newest", "oldest", or "updated".
export default function SortBar({ value, onChange }) {
  return (
    <label className="sort-bar">
      Sort by
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Default</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="updated">Most recently updated</option>
      </select>
    </label>
  );
} 