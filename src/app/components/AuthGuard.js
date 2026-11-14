'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthTokens, isTokenExpiringSoon, refreshAuthToken, validateAuthSession } from '@/lib/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // List of paths that do not require authentication
    const publicPaths = ['/', '/login', '/meet', '/api', '/booking', '/pricing', '/widget', '/services', '/tickets/chat', '/products', '/features'];
    const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const handleExpired = () => router.replace('/login');

    if (isPublic) {
      const publicPathCheck = window.setTimeout(() => setIsChecking(false), 0);
      return () => window.clearTimeout(publicPathCheck);
    }

    let active = true;

    // Check auth session using refresh token / token validation
    const checkSession = async () => {
      const idToken = localStorage.getItem('sb_id_token') || localStorage.getItem('sb_auth_token');
      const refreshToken = localStorage.getItem('sb_refresh_token');

      // Neither token exists -> unauthenticated
      if (!idToken && !refreshToken) {
        if (active) router.replace('/login');
        return;
      }

      // If ID token is expired or expiring, or if only refresh token exists, validate & renew
      if (!idToken || isTokenExpiringSoon(5 * 60 * 1000)) {
        const user = await validateAuthSession();
        if (!user && active) {
          router.replace('/login');
          return;
        }
      }

      if (active) {
        setIsChecking(false);
      }
    };

    checkSession();

    window.addEventListener('sb-auth-expired', handleExpired);
    const refreshTimer = window.setInterval(async () => {
      if (isTokenExpiringSoon(5 * 60 * 1000) && !(await refreshAuthToken())) {
        clearAuthTokens();
      }
    }, 60 * 1000);

    return () => {
      active = false;
      window.removeEventListener('sb-auth-expired', handleExpired);
      window.clearInterval(refreshTimer);
    };
  }, [pathname, router]);

  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-default, #fff)' }}>Loading...</div>;
  }

  return <>{children}</>;
}
