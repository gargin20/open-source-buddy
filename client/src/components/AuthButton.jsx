import { useEffect, useState } from 'react';
import { getMe, logout } from '../api.js';

// Shows Sign-in / signed-in user / Sign-out depending on auth state.
export default function AuthButton() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  // Still loading — render nothing to avoid layout shift
  if (user === undefined) return null;

  if (!user) {
    return (
      <a className="btn" href="/api/auth/login">
        Sign in with GitHub
      </a>
    );
  }

  return (
    <div className="auth-user" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img
        src={user.avatarUrl}
        alt={user.login}
        width={24}
        height={24}
        style={{ borderRadius: '50%' }}
      />
      <span>{user.login}</span>
      <button
        className="btn"
        onClick={async () => {
          await logout();
          setUser(null);
        }}
      >
        Sign out
      </button>
    </div>
  );
}
