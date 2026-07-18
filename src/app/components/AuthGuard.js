'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // List of paths that do not require authentication
    const publicPaths = ['/', '/login', '/meet', '/api', '/booking'];
    const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isPublic) {
      setIsChecking(false);
      return;
    }

    // Check auth
    const token = localStorage.getItem('sb_id_token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-default, #fff)' }}>Loading...</div>;
  }

  return <>{children}</>;
}
