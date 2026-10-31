import { useEffect, useState } from 'react';
import { getAuth, signOut } from '../api.js';

const AUTH_ERRORS = {
  access_denied: 'GitHub sign-in was cancelled.',
  invalid_state: 'Sign-in could not be verified. Please try again.',
  missing_code: 'GitHub did not return an authorization code. Please try again.',
  not_configured: 'GitHub sign-in is not configured on this server.',
  oauth_failed: 'GitHub sign-in failed. Please try again.',
};

export default function AuthButton() {
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('authError');
    if (authError) {
      setError(AUTH_ERRORS[authError] || 'GitHub sign-in failed. Please try again.');
      params.delete('authError');
      const query = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
    }

    getAuth()
      .then(setAuth)
      .catch((requestError) => setError(`Could not check sign-in status: ${requestError.message}`));
  }, []);

  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
      setAuth((current) => ({ ...current, user: null, expired: false }));
      window.dispatchEvent(new Event('osb:authchange'));
    } catch (requestError) {
      setError(`Could not sign out: ${requestError.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!auth) {
    return (
      <div className="auth-control" aria-live="polite">
        <span className="auth-message" role={error ? 'alert' : undefined}>
          {error || 'Checking sign-in…'}
        </span>
      </div>
    );
  }

  return (
    <div className="auth-control">
      {auth.user ? (
        <>
          <span className="auth-message">Signed in as {auth.user.name || `@${auth.user.login}`}</span>
          <button className="btn" type="button" onClick={handleSignOut} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      ) : auth.enabled ? (
        <>
          <a className="btn" href="/api/auth/github">
            Sign in with GitHub
          </a>
          <span className="auth-message">
            {auth.expired ? 'Your session expired. ' : ''}
            Signed-out saves stay in this browser.
          </span>
        </>
      ) : (
        <>
          <button className="btn" type="button" disabled>
            Sign in with GitHub
          </button>
          <span className="auth-message">
            GitHub sign-in is not configured. Signed-out saves stay in this browser.
          </span>
        </>
      )}
      {error && (
        <span className="auth-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
