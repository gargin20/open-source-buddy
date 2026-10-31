export default function SortBar({ value, onChange }) {
  return (
    <label className="filters-label">
      Sort by
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Default order</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="updated">Most recently updated</option>
      </select>
    </label>
  );
}
