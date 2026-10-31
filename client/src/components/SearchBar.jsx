import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [text, setText] = useState('');

  // Enter and the Search button both submit the form, so they share this handler.
  function handleSubmit(e) {
    e.preventDefault();
    onSearch(text.trim());
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
      <button type="submit" className="btn primary">
        Search
      </button>
    </form>
  );
}
