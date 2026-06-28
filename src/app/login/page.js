'use strict';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend auth
      const url = `${typeof window !== 'undefined' ? '/api-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')}/softbridge/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Save credentials and redirect to dashboard
      localStorage.setItem('sb_id_token', data.idToken);
      localStorage.setItem('sb_uid', data.uid);
      if (data.user) {
        localStorage.setItem('sb_user', JSON.stringify(data.user));
      }
      
      router.push('/sheets');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Decorative Blob */}
      <div className={styles.blob}></div>

      {/* Main card */}
      <div className={`${styles.loginCard} glass`}>
        <div className={styles.logo}>
          <span className={styles.logoText}>SoftBridge</span>
          <span className={styles.logoSub}>Workspace</span>
        </div>
        
        <h2 className={styles.title}>Sign in to your account</h2>
        <p className={styles.subtitle}>Enter your details below to access Sheets and Docs</p>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footerText}>
          Don't have an account?{' '}
          <a href="https://account.softbridgelabs.in/" target="_blank" rel="noopener noreferrer" className={styles.signupLink}>
            Sign up here
          </a>
        </div>
      </div>
    </div>
  );
}
