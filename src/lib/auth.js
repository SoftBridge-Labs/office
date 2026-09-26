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

export function storeAuthTokens({ idToken, refreshToken, expiresIn }) {
  if (typeof window === 'undefined' || !idToken) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, idToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  const expiry = expiresIn ? Date.now() + Number(expiresIn) * 1000 : getTokenExpiry(idToken);
  if (expiry) localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
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

export function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}
