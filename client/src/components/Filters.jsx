const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'CSS'];
const TOPICS = ['web', 'cli', 'education', 'react', 'data', 'backend', 'docs', 'design'];

export default function Filters({ filters, onChange }) {
  return (
    <div className="filters">
      <label>
        Language
        <input
          list="language-options"
          value={filters.language}
          onChange={(e) => onChange({ language: e.target.value })}
          placeholder="Any language"
        />
        <datalist id="language-options">
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang} />
          ))}
        </datalist>
      </label>
      <label>
        Topic
        <select value={filters.topic} onChange={(e) => onChange({ topic: e.target.value })}>
          <option value="">Any topic</option>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
