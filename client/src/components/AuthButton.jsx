import { useEffect, useState } from 'react';

export default function AuthButton() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authResult = query.get('auth');
    const reason = query.get('reason');

    if (authResult === 'error') {
      setError(reason || 'GitHub sign-in failed.');
    }

    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        setUser(data.user ?? null);

        if (authResult) {
          const url = new URL(window.location.href);
          url.searchParams.delete('auth');
          url.searchParams.delete('reason');
          window.history.replaceState({}, '', url);
        }
      })
      .catch(() => setError('Could not contact the authentication server.'))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
    }
  }

  if (loading) {
    return <button type="button" disabled>Loading account...</button>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button type="button" onClick={() => (window.location.href = '/api/auth/github')}>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <button type="button" onClick={() => (window.location.href = '/api/auth/github')}>
        Sign in with GitHub
      </button>
    );
  }

  return (
    <div className="auth-user">
      <img
        src={user.avatarUrl}
        alt=""
        width="28"
        height="28"
        style={{ borderRadius: '50%' }}
      />
      <span>{user.login}</span>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}
