import { NextResponse } from 'next/server';

/**
 * GET /api/turn
 *
 * Returns ICE servers (STUN + Cloudflare TURN) for WebRTC.
 *
 * Credentials are cached server-side for their full TTL (24h).
 * Cloudflare API is only called once per 24 hours (or on first request / near expiry),
 * not on every meeting join.
 *
 * Cloudflare TURN docs: https://developers.cloudflare.com/calls/turn/
 */

const CF_KEY_ID    = process.env.CLOUDFLARE_TURN_KEY_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const TTL_SECONDS  = 86400;                  // 24 hours — matches Cloudflare credential lifetime
const REFRESH_BUFFER = 60 * 60;             // Refresh 1 hour before expiry

// ── Server-side in-memory cache ─────────────────────────────────────────────
// Survives across requests within the same server process (Next.js keeps the
// module alive between requests). Wiped on deploy/restart → auto-refetches.
let cache = {
  iceServers: null,
  expiresAt: 0,   // Unix timestamp (seconds)
};

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Fetch fresh credentials from Cloudflare and update the cache.
 */
async function refreshCredentials() {
  const res = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${CF_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: TTL_SECONDS }),
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare TURN API ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Cloudflare returns iceServers as an array. We need to filter out TCP candidates
  // because TCP introduces massive head-of-line blocking which causes the exact
  // high latency/lag the user is experiencing. UDP is required for real-time media.
  const filteredIceServers = data.iceServers.map(server => {
    if (server.urls && Array.isArray(server.urls)) {
      // Keep STUN, and ONLY keep TURN urls that specify transport=udp
      const udpUrls = server.urls.filter(url => 
        url.startsWith('stun:') || url.includes('transport=udp')
      );
      return { ...server, urls: udpUrls };
    }
    return server;
  });

  // We prepend Google STUN for faster direct P2P, then append Cloudflare's UDP servers.
  cache.iceServers  = [...STUN_SERVERS, ...filteredIceServers];
  cache.expiresAt   = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  console.log(`[TURN] Cloudflare credentials refreshed — valid until ${new Date(cache.expiresAt * 1000).toISOString()}`);

  return cache.iceServers;
}

/**
 * Returns cached credentials, refreshing if expired or within the buffer window.
 */
async function getIceServers() {
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = !cache.iceServers || (cache.expiresAt - now) < REFRESH_BUFFER;

  if (needsRefresh) {
    return await refreshCredentials();
  }

  const secsLeft = cache.expiresAt - now;
  console.log(`[TURN] Serving cached credentials — expires in ${Math.round(secsLeft / 3600)}h`);
  return cache.iceServers;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  // Cloudflare not configured — return STUN only (same-network calls still work)
  if (!CF_KEY_ID || !CF_API_TOKEN) {
    console.warn('[TURN] CLOUDFLARE_TURN_KEY_ID / CLOUDFLARE_API_TOKEN not set — STUN only');
    return NextResponse.json({
      success: true,
      iceServers: STUN_SERVERS,
      warning: 'TURN not configured — cross-network calls may fail',
    });
  }

  try {
    const iceServers = await getIceServers();
    return NextResponse.json({ success: true, iceServers });
  } catch (err) {
    console.error('[TURN] Failed to get Cloudflare credentials:', err.message);
    // Graceful degradation — never hard-fail the meeting join
    return NextResponse.json({
      success: true,
      iceServers: STUN_SERVERS,
      warning: 'TURN temporarily unavailable — same-network calls only',
    });
  }
}
