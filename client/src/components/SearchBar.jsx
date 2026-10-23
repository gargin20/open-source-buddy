import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q') ?? '';
    onSearch(String(q).trim());
  }

  return (
    <form className="search" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        name="query"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search issues, e.g. tests, README, docs"
        aria-label="Search issues"
      />
      <button type="button" className="btn primary" onClick={() => onSearch(text.trim())}>
        Search
      </button>
    </form>
  );
}
