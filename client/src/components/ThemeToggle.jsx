export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="btn" onClick={onToggle} aria-label="Toggle light and dark theme">
      {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
    </button>
  );
}
