'use client';

const ACCESS_TOKEN_KEY = 'sb_id_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';
const TOKEN_EXPIRY_KEY = 'sb_token_expires_at';

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.exp) * 1000;
  } catch {
    return 0;
  }
}

export function storeAuthTokens({ idToken, refreshToken, expiresIn, user, uid }) {
  if (typeof window === 'undefined') return;
  if (idToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, idToken);
    localStorage.setItem('sb_auth_token', idToken); // Guide alignment
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem('sb_user', JSON.stringify(user));
    if (user.uid) localStorage.setItem('sb_uid', user.uid);
  } else if (uid) {
    localStorage.setItem('sb_uid', uid);
  }
  const expiry = expiresIn ? Date.now() + Number(expiresIn) * 1000 : (idToken ? getTokenExpiry(idToken) : 0);
  if (expiry) localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('sb_auth_token');
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem('sb_user');
  localStorage.removeItem('sb_uid');
  window.dispatchEvent(new Event('sb-auth-expired'));
}

export function isTokenExpiringSoon(bufferMs = 60 * 1000) {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const storedExpiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY));
  const expiry = storedExpiry || getTokenExpiry(token || '');
  return !token || !expiry || expiry - Date.now() <= bufferMs;
}

export async function refreshAuthToken() {
  if (typeof window === 'undefined') return false;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const response = await fetch('/api-proxy/softbridge/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.idToken) throw new Error('Token refresh failed');
    storeAuthTokens(data);
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

export async function validateAuthSession() {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const idToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  // If no tokens exist at all, user is not logged in
  if (!refreshToken && !idToken) return null;

  try {
    const tokenToValidate = refreshToken || idToken;
    const tokenType = refreshToken ? 'refresh' : 'id';

    const response = await fetch('/api-proxy/softbridge/token/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenToValidate, tokenType }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.valid) {
      // Session is valid. Update tokens and user profile
      storeAuthTokens({
        idToken: data.idToken || idToken,
        refreshToken: data.refreshToken || refreshToken,
        expiresIn: data.expiresIn,
        user: data.user,
        uid: data.uid,
      });
      return data.user || { uid: data.uid };
    } else {
      // Token is invalid or revoked — clear tokens
      clearAuthTokens();
      return null;
    }
  } catch (err) {
    console.error('Session validation error:', err);
    // On network failure, don't abruptly clear session if non-expired ID token exists
    if (!isTokenExpiringSoon()) {
      try {
        const storedUser = localStorage.getItem('sb_user');
        return storedUser ? JSON.parse(storedUser) : { uid: localStorage.getItem('sb_uid') };
      } catch {}
    }
    return null;
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('sb_auth_token') || '';
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}
