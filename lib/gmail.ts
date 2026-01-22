import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// Complete auth session for web browser - MUST be called at module level
WebBrowser.maybeCompleteAuthSession();

// Types
export interface GoogleAuthResult {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  labelIds: string[];
}

export interface EmailContent {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  attachments: AttachmentInfo[];
}

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
}

// Google OAuth configuration from app.json
const googleOAuthConfig = Constants.expoConfig?.extra?.googleOAuth || {};
const WEB_CLIENT_ID = googleOAuthConfig.webClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const ANDROID_CLIENT_ID = googleOAuthConfig.androidClientId || '';
const IOS_CLIENT_ID = googleOAuthConfig.iosClientId || '';

// Discovery document for Google OAuth
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Check if running in Expo Go
 * Expo Go has limitations with Google OAuth due to:
 * 1. No native Google Sign-In SDK
 * 2. exp:// redirect URIs not accepted by Google
 * 3. auth.expo.io proxy is deprecated
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Check if running in a development build (expo-dev-client)
 */
function isDevelopmentBuild(): boolean {
  return Constants.executionEnvironment === 'standalone' || 
         Constants.executionEnvironment === 'bare';
}

/**
 * Authenticate with Google OAuth to get Gmail access
 * 
 * IMPORTANT LIMITATIONS:
 * - Expo Go: Google OAuth does NOT work due to redirect URI restrictions
 * - Development Build / Production: Works with proper configuration
 * 
 * For Expo Go testing, use a development build instead:
 * npx expo install expo-dev-client
 * npx expo prebuild
 * npx expo run:android
 */
export async function authenticateWithGoogle(): Promise<GoogleAuthResult> {
  console.log('=== Google OAuth Configuration ===');
  console.log('Platform:', Platform.OS);
  console.log('Execution Environment:', Constants.executionEnvironment);
  console.log('Is Expo Go:', isExpoGo());
  console.log('Is Development Build:', isDevelopmentBuild());
  
  // Check if running in Expo Go - show helpful message
  if (isExpoGo()) {
    const message = 
      'Gmail connection is not available in Expo Go.\n\n' +
      'Google OAuth requires a development build due to redirect URI restrictions.\n\n' +
      'To test Gmail integration:\n' +
      '1. Run: npx expo prebuild\n' +
      '2. Run: npx expo run:android\n\n' +
      'Or create an EAS development build:\n' +
      'eas build --profile development --platform android';
    
    console.log('⚠️ ' + message);
    
    throw new Error(message);
  }
  
  if (!WEB_CLIENT_ID) {
    throw new Error(
      'Google OAuth not configured.\n\n' +
      'Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.'
    );
  }

  // For standalone/production builds, use the appropriate client ID
  const clientId = Platform.OS === 'android' 
    ? (ANDROID_CLIENT_ID || WEB_CLIENT_ID)
    : Platform.OS === 'ios' 
      ? (IOS_CLIENT_ID || WEB_CLIENT_ID)
      : WEB_CLIENT_ID;
  
  // Create redirect URI for standalone builds
  // This will be: grylin://oauth (custom scheme)
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'grylin',
    path: 'oauth',
  });

  console.log('Redirect URI:', redirectUri);
  console.log('Client ID:', clientId?.substring(0, 50) + '...');
  console.log('================================');

  // Scopes for Gmail readonly access
  const scopes = [
    'openid',
    'profile', 
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
  ];

  try {
    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    
    console.log('Opening auth URL...');
    
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl.toString(),
      redirectUri,
      {
        showInRecents: true,
        preferEphemeralSession: false,
      }
    );

    console.log('Auth result type:', result.type);

    if (result.type === 'cancel') {
      throw new Error('Sign in was cancelled');
    }

    if (result.type === 'dismiss') {
      throw new Error('Sign in was dismissed');
    }

    if (result.type !== 'success') {
      throw new Error(`Authentication failed: ${result.type}`);
    }

    // Parse the response URL
    const responseUrl = result.url;
    console.log('Got response URL');

    // Check for errors
    if (responseUrl.includes('error=')) {
      const hashParams = new URLSearchParams(responseUrl.split('#')[1] || '');
      const queryParams = new URLSearchParams(responseUrl.split('?')[1]?.split('#')[0] || '');
      const error = hashParams.get('error') || queryParams.get('error');
      const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
      
      if (error === 'redirect_uri_mismatch') {
        throw new Error(
          `Redirect URI Mismatch!\n\n` +
          `Add this URI to Google Cloud Console:\n${redirectUri}\n\n` +
          `Steps:\n` +
          `1. Go to console.cloud.google.com/apis/credentials\n` +
          `2. Click your OAuth Client ID\n` +
          `3. Add the URI to "Authorized redirect URIs"\n` +
          `4. Save and wait 5 minutes`
        );
      }
      
      throw new Error(`Google OAuth error: ${errorDesc || error}`);
    }

    // Extract access token from hash fragment
    const hashIndex = responseUrl.indexOf('#');
    if (hashIndex === -1) {
      throw new Error('No token in response');
    }

    const hashParams = new URLSearchParams(responseUrl.substring(hashIndex + 1));
    const accessToken = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');

    if (!accessToken) {
      throw new Error('No access token received from Google');
    }

    // Fetch user info to get email
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { 
        headers: { 
          Authorization: `Bearer ${accessToken}` 
        } 
      }
    );

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      throw new Error(`Failed to get user information: ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      throw new Error('No email returned from Google');
    }

    console.log('✅ Successfully authenticated:', userInfo.email);

    return {
      accessToken,
      refreshToken: '',
      email: userInfo.email,
      expiresAt: Date.now() + (parseInt(expiresIn || '3600', 10) * 1000),
    };

  } catch (error: any) {
    console.error('OAuth Error:', error);
    throw error;
  }
}

/**
 * Check if Gmail OAuth is available in current environment
 */
export function isGmailOAuthAvailable(): boolean {
  return !isExpoGo();
}

/**
 * Get a user-friendly message about Gmail availability
 */
export function getGmailAvailabilityMessage(): string | null {
  if (isExpoGo()) {
    return 'Gmail connection requires a development build. Expo Go has limitations with Google OAuth.';
  }
  return null;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  if (!refreshToken) {
    throw new Error('No refresh token available. Please sign in again.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: WEB_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  return response.json();
}

// Gmail API
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function fetchEmails(accessToken: string, since: Date): Promise<GmailMessage[]> {
  const sinceTimestamp = Math.floor(since.getTime() / 1000);
  const query = `after:${sinceTimestamp}`;

  const response = await fetch(
    `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch emails: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.messages || [];
}

export async function getEmailContent(accessToken: string, messageId: string): Promise<EmailContent> {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch email: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return parseEmailData(data);
}

function parseEmailData(data: any): EmailContent {
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let body = '';
  if (data.payload?.body?.data) {
    body = decodeBase64Url(data.payload.body.data);
  } else if (data.payload?.parts) {
    const textPart = data.payload.parts.find(
      (p: any) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
    );
    if (textPart?.body?.data) {
      body = decodeBase64Url(textPart.body.data);
    }
  }

  const attachments: AttachmentInfo[] = [];
  if (data.payload?.parts) {
    for (const part of data.payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }
    }
  }

  return {
    id: data.id,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    body,
    date: getHeader('Date'),
    attachments,
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

// Email classification
const TRANSACTIONAL_KEYWORDS = [
  'invoice', 'payment', 'bill', 'receipt', 'transaction', 'charge',
  'amount due', 'balance', 'statement', 'pay now', 'payment due',
  'order confirmation', 'order #', 'shipping', 'delivery', 'tracking',
  'account statement', 'subscription', 'renewal', 'expiring', 'due date',
  'bank', 'credit card', 'transfer', 'deposit', 'tuition', 'fee',
  'warranty', 'appointment', 'booking', 'reservation',
];

const PROMOTIONAL_KEYWORDS = [
  'unsubscribe', 'newsletter', 'promotion', 'sale', 'discount',
  'offer', 'deal', 'limited time', 'exclusive', 'free shipping',
  'shop now', 'buy now', 'save', '% off', 'coupon',
];

export function isTransactionalEmail(email: EmailContent): boolean {
  const content = `${email.subject} ${email.body}`.toLowerCase();

  const promotionalScore = PROMOTIONAL_KEYWORDS.reduce((score, keyword) => {
    return content.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);

  if (promotionalScore >= 3) return false;

  const transactionalScore = TRANSACTIONAL_KEYWORDS.reduce((score, keyword) => {
    return content.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);

  const hasAmount = /\$[\d,]+\.?\d*|\₹[\d,]+\.?\d*|[\d,]+\.?\d*\s*(USD|INR|EUR|GBP)/i.test(content);
  const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|due\s+(by|on|date)/i.test(content);
  const hasOrderNumber = /order\s*#?\s*\d+|invoice\s*#?\s*\d+|confirmation\s*#?\s*\d+/i.test(content);

  let score = transactionalScore;
  if (hasAmount) score += 2;
  if (hasDate) score += 2;
  if (hasOrderNumber) score += 3;

  return score >= 3;
}

export async function filterTransactionalEmails(
  emails: GmailMessage[],
  accessToken: string
): Promise<EmailContent[]> {
  const transactionalEmails: EmailContent[] = [];

  for (const email of emails) {
    try {
      const content = await getEmailContent(accessToken, email.id);
      if (isTransactionalEmail(content)) {
        transactionalEmails.push(content);
      }
    } catch (error) {
      console.warn(`Failed to fetch email ${email.id}:`, error);
    }
  }

  return transactionalEmails;
}

// Batch processing
export interface BatchConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxConcurrent: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 10,
  delayBetweenBatches: 100,
  maxConcurrent: 5,
};

export async function filterTransactionalEmailsBatched(
  emails: GmailMessage[],
  accessToken: string,
  config: Partial<BatchConfig> = {},
  onProgress?: (processed: number, total: number) => void
): Promise<EmailContent[]> {
  const { batchSize, delayBetweenBatches, maxConcurrent } = { ...DEFAULT_BATCH_CONFIG, ...config };
  const transactionalEmails: EmailContent[] = [];
  let processed = 0;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const batchResults = await processWithConcurrency(
      batch,
      async (email) => {
        try {
          const content = await getEmailContent(accessToken, email.id);
          return isTransactionalEmail(content) ? content : null;
        } catch {
          return null;
        }
      },
      maxConcurrent
    );

    for (const result of batchResults) {
      if (result) transactionalEmails.push(result);
    }

    processed += batch.length;
    onProgress?.(processed, emails.length);

    if (i + batchSize < emails.length) {
      await delay(delayBetweenBatches);
    }
  }

  return transactionalEmails;
}

async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrent: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then((result) => { results.push(result); });
    executing.push(promise);

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
      executing.splice(0, executing.filter(p => {
        let settled = false;
        p.then(() => (settled = true)).catch(() => (settled = true));
        return settled;
      }).length);
    }
  }

  await Promise.all(executing);
  return results;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchEmailsPaginated(
  accessToken: string,
  since: Date,
  maxResults: number = 500,
  onProgress?: (fetched: number) => void
): Promise<GmailMessage[]> {
  const sinceTimestamp = Math.floor(since.getTime() / 1000);
  const query = `after:${sinceTimestamp}`;
  const allMessages: GmailMessage[] = [];
  let pageToken: string | undefined;

  while (allMessages.length < maxResults) {
    const url = new URL(`${GMAIL_API_BASE}/messages`);
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', Math.min(100, maxResults - allMessages.length).toString());
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch emails: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const messages = data.messages || [];
    allMessages.push(...messages);
    
    onProgress?.(allMessages.length);

    pageToken = data.nextPageToken;
    if (!pageToken || messages.length === 0) break;
  }

  return allMessages;
}
