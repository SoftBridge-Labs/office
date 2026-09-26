'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthTokens, isTokenExpiringSoon, refreshAuthToken } from '@/lib/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // List of paths that do not require authentication
    const publicPaths = ['/', '/login', '/meet', '/api', '/booking', '/pricing'];
    const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const handleExpired = () => router.replace('/login');

    if (isPublic) {
      const publicPathCheck = window.setTimeout(() => setIsChecking(false), 0);
      return () => window.clearTimeout(publicPathCheck);
    }

    // Check auth
    const token = localStorage.getItem('sb_id_token');
    if (!token) {
      router.replace('/login');
    } else {
      const authCheck = window.setTimeout(() => setIsChecking(false), 0);
      window.addEventListener('sb-auth-expired', handleExpired);
      const refreshTimer = window.setInterval(async () => {
        if (isTokenExpiringSoon(5 * 60 * 1000) && !(await refreshAuthToken())) {
          clearAuthTokens();
        }
      }, 60 * 1000);
      return () => {
        window.clearTimeout(authCheck);
        window.removeEventListener('sb-auth-expired', handleExpired);
        window.clearInterval(refreshTimer);
      };
    }

  }, [pathname, router]);

  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-default, #fff)' }}>Loading...</div>;
  }

  return <>{children}</>;
}
