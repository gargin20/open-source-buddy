import { useEffect, useState } from 'react';
import { getStatus } from './api.js';
import { useIssues } from './hooks/useIssues.js';
import { useSaved } from './hooks/useSaved.js';
import { useTheme } from './hooks/useTheme.js';
import ThemeToggle from './components/ThemeToggle.jsx';
import AuthButton from './components/AuthButton.jsx';
import SampleBanner from './components/SampleBanner.jsx';
import SearchBar from './components/SearchBar.jsx';
import Filters from './components/Filters.jsx';
import SortBar from './components/SortBar.jsx';
import IssueCard from './components/IssueCard.jsx';
import Pagination from './components/Pagination.jsx';
import Spinner from './components/Spinner.jsx';
import IssueDetail from './components/IssueDetail.jsx';
import SavedSidebar from './components/SavedSidebar.jsx';
import PRCoach from './components/PRCoach.jsx';

const DEFAULT_FILTERS = { q: '', language: '', topic: '', sort: '', page: 1 };

export default function App() {
  const { theme, toggle } = useTheme();
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState('issues');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null); // { issue, index }
  const { data, loading, error } = useIssues(filters);
  const { saved, save, remove, isSaved } = useSaved();

  useEffect(() => {
    getStatus().then(setStatus).catch(() => {});
  }, []);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const goToPage = (page) => setFilters((f) => ({ ...f, page }));

  return (
    <div className="app">
      {status?.githubMode === 'mock' && <SampleBanner />}
      <header className="topbar">
        <h1>Open Source Buddy</h1>
        <nav className="tabs" aria-label="Sections">
          <button className={tab === 'issues' ? 'tab active' : 'tab'} onClick={() => setTab('issues')}>
            Issues
          </button>
          <button className={tab === 'coach' ? 'tab active' : 'tab'} onClick={() => setTab('coach')}>
            PR Coach
          </button>
        </nav>
        <div className="topbar-actions">
          <AuthButton />
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      {tab === 'coach' ? (
        <PRCoach />
      ) : (
        <main className="layout">
          <section className="feed" aria-label="Issue feed">
            <SearchBar onSearch={(q) => updateFilters({ q })} />
            <div className="toolbar">
              <Filters filters={filters} onChange={updateFilters} />
              <SortBar value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
            </div>

            {loading && <Spinner />}
            {error && (
              <div className="error" role="alert">
                Could not load issues: {error}
              </div>
            )}
            {!loading && !error && data.items.length === 0 && (
              <p className="empty">No issues match your filters.</p>
            )}

            <div className="cards">
              {data.items.map((issue, index) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  active={selected?.issue.id === issue.id}
                  saved={isSaved(issue.id)}
                  onSelect={() => setSelected({ issue, index })}
                  onSave={() => save(issue)}
                />
              ))}
            </div>

            <Pagination page={data.page} totalPages={data.totalPages} onPage={goToPage} />
          </section>

          <div className="side">
            {selected && (
              <IssueDetail
                issue={selected.issue}
                issues={data.items}
                index={selected.index}
                onClose={() => setSelected(null)}
              />
            )}
            <SavedSidebar saved={saved} onRemove={remove} />
          </div>
        </main>
      )}
    </div>
  );
}
