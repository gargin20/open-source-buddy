import { useState } from 'react';

export default function
 SearchBar({ onSearch }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const query = text.trim();
    onSearch(query);
  }

  return (
    <form
     className="search"
      onSubmit={handleSubmit}
       role="search">
      <input
        type="search"
        name="query"
        value={text}
        onChange={(e) =>
           setText(e.target.value)}

        placeholder="Search issues, e.g. tests, README, docs"
        aria-label="Search issues"
      />
      <button
       type="submit"
        className="btn primary">                                      
        Search
      </button>
    </form>
  );
}
