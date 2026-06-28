import { NextResponse } from 'next/server';

export function proxy(request) {
  if (request.nextUrl.pathname.startsWith('/api-proxy/')) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Remove the /api-proxy prefix to forward the clean path to the backend
    const path = request.nextUrl.pathname.substring('/api-proxy'.length);
    // Construct the target URL preservation of query parameters
    const targetUrl = new URL(path + request.nextUrl.search, backendUrl);
    
    return NextResponse.rewrite(targetUrl);
  }
}

export const config = {
  matcher: '/api-proxy/:path*',
};
