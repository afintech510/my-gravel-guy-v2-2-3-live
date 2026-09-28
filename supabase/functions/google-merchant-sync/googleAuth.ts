// Mints a short-lived Google OAuth2 access token from a service-account key, server-side,
// using the RFC 7523 JWT-Bearer flow. This replaces the exposed-in-the-browser Merchant
// Center access token that `GoogleShoppingManager.tsx` used to hold in React state (see
// docs/metro/research/ai-ads-and-google-shopping.md B4 #5) — the token now never leaves
// this edge function.
//
// [FACT, high confidence but not re-verified live this session per this agent's
// "never call live Google APIs" constraint] The OAuth scope for Merchant API access is the
// same `https://www.googleapis.com/auth/content` scope Content API used — Google's Merchant
// API migration guide reuses Content API's auth model (OAuth 2.0, same scope surface) per
// docs/metro/research/ai-ads-and-google-shopping.md B3. Confirm against
// https://developers.google.com/merchant/api/guides/quickstart before first live sync.
//
// [NEEDS VERIFICATION] The service account also needs to be added as a user on the target
// Merchant Center account (Merchant Center > Settings > Account access > Add user, using the
// service account's email) — a Google Cloud IAM role alone is not sufficient. See the
// implementation doc's setup steps.
import { create, type Header, type Payload } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

export const MERCHANT_API_SCOPE = 'https://www.googleapis.com/auth/content';

export interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/** Parses the PEM-encoded PKCS8 private key from a service-account JSON into a CryptoKey. */
async function importServiceAccountKey(pem: string): Promise<CryptoKey> {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(stripped), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Mint a Google OAuth2 access token for the given service account + scope(s).
 * Throws on any failure (malformed key, network error, non-2xx token response) — callers
 * should catch and surface a clean error to the caller rather than let this bubble raw.
 */
export async function mintGoogleAccessToken(
  serviceAccount: GoogleServiceAccount,
  scopes: string[] = [MERCHANT_API_SCOPE],
): Promise<string> {
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);

  const header: Header = { alg: 'RS256', typ: 'JWT' };
  const payload: Payload = {
    iss: serviceAccount.client_email,
    scope: scopes.join(' '),
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };

  const key = await importServiceAccountKey(serviceAccount.private_key);
  const assertion = await create(header, payload, key);

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '<unreadable body>');
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error('Google token exchange succeeded but returned no access_token');
  }
  return data.access_token;
}

/** Parses and validates the GOOGLE_SERVICE_ACCOUNT_JSON secret. */
export function parseServiceAccountJson(raw: string): GoogleServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  const sa = parsed as Partial<GoogleServiceAccount>;
  if (!sa.client_email || !sa.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }
  return sa as GoogleServiceAccount;
}
