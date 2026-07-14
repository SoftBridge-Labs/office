import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_SB_CLIENT_ID: process.env.NEXT_PUBLIC_SB_CLIENT_ID || '',
    NEXT_PUBLIC_SB_CLIENT_SECRET: process.env.NEXT_PUBLIC_SB_CLIENT_SECRET || '',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    NEXT_PUBLIC_ACCOUNTS_URL: process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://account.softbridgelabs.in',
  };
  
  return new NextResponse(`window.__ENV__ = ${JSON.stringify(env)};`, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
