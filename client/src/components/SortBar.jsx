export default function SortBar({ value, onChange }) {
  return (
    <div className="sort-bar">
      <label htmlFor="sort-select">Sort by: </label>
      <select
        id="sort-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort issues"
      >
        <option value="">Default</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="comments">Most commented</option>
      </select>
    </div>
  );
}
