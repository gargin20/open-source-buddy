import { useEffect, useState } from 'react';

function initialTheme() {
  try {
    const stored = localStorage.getItem('osb-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // storage may be blocked
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('osb-theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}
