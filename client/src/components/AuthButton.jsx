import { useEffect, useState } from 'react';
import { getMe, signInWithGitHub, signOut } from '../api.js';

/**
 * AuthButton — three possible states:
 *
 *  loading   → blank (avoid layout shift)
 *  signed in → avatar + name + "Sign out" button
 *  signed out → "Sign in with GitHub" button
 *
 * If OAuth is not configured on the server the sign-in button is still shown
 * but clicking it will receive a 501 and the error is displayed gracefully.
 */
export default function AuthButton() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    // Fetch the current session user on mount
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null)); // treat network errors as "not signed in"
  }, []);

  // Show nothing until we know the auth state — avoids a flash of the sign-in button
  if (user === undefined) return null;

  if (user) {
    return (
      <div className="auth-user">
        {user.avatar_url && (
          <img
            className="auth-avatar"
            src={user.avatar_url}
            alt={user.login}
            width={24}
            height={24}
          />
        )}
        <span className="auth-name" title={`@${user.login}`}>
          {user.name || user.login}
        </span>
        <button
          className="btn auth-signout"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut();
              setUser(null);
            } catch {
              setError('Sign-out failed. Please try again.');
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        {error && <span className="auth-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="auth-signed-out">
      <button
        className="btn auth-signin"
        onClick={() => {
          setError('');
          signInWithGitHub();
        }}
      >
        Sign in with GitHub
      </button>
      {error && <span className="auth-error">{error}</span>}
    </div>
  );
}
