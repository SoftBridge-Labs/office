'use client';

import { useState, useCallback } from 'react';

const getEnv = (key, defaultVal) => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) return window.__ENV__[key];
  return process.env[key] || defaultVal;
};

const ACCOUNTS_URL = getEnv('NEXT_PUBLIC_ACCOUNTS_URL', "https://account.softbridgelabs.in");
const CLIENT_ID = getEnv('NEXT_PUBLIC_SB_CLIENT_ID', '');
const CLIENT_SECRET = getEnv('NEXT_PUBLIC_SB_CLIENT_SECRET', '');

export default function OneTapLogin({ onSuccess, buttonText = "Sign in with SoftBridge", className = "", style = {} }) {
  const [loading, setLoading] = useState(false);

  const triggerSoftBridgeLogin = useCallback(() => {
    if (loading) return;
    setLoading(true);

    const currentOrigin = window.location.origin;
    const popupWidth = 450;
    const popupHeight = 600;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;

    const loginPopup = window.open(
      `${ACCOUNTS_URL}/login/popup?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&origin=${encodeURIComponent(currentOrigin)}`,
      "SoftBridgeLoginPopup",
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );

    if (!loginPopup) {
      alert("Please enable popups to sign in with your SoftBridge Account.");
      setLoading(false);
      return;
    }

    const messageListener = (event) => {
      // Validate origin
      if (event.origin !== ACCOUNTS_URL) return;

      const authData = event.data;
      if (authData && authData.success) {
        
        // Save credentials
        localStorage.setItem('sb_id_token', authData.idToken);
        if (authData.user && authData.user.uid) {
            localStorage.setItem('sb_uid', authData.user.uid);
        }
        if (authData.user) {
          localStorage.setItem('sb_user', JSON.stringify(authData.user));
        }

        window.removeEventListener("message", messageListener);
        setLoading(false);

        if (onSuccess) {
          onSuccess(authData);
        }
      }
    };

    window.addEventListener("message", messageListener);

    // Watch for popup closed by user
    const popupTimer = setInterval(() => {
      if (loginPopup.closed) {
        clearInterval(popupTimer);
        window.removeEventListener("message", messageListener);
        setLoading(false);
      }
    }, 500);

  }, [loading, onSuccess]);

  return (
    <button 
      onClick={triggerSoftBridgeLogin} 
      disabled={loading}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style
      }}
    >
      {loading ? 'Signing in...' : buttonText}
    </button>
  );
}
