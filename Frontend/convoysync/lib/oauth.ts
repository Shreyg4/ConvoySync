import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lets the auth session finish cleanly when the browser redirects back.
WebBrowser.maybeCompleteAuthSession();

// Backend base URL. Set EXPO_PUBLIC_API_URL in .env (defaults to the dev port 8080).
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'token';

export type OAuthProvider = 'google' | 'github';

export type OAuthResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'cancelled' | 'error'; message?: string };

// Returns the stored JWT regardless of how the user signed in:
// OAuth saves it in SecureStore; email/password login saves it in AsyncStorage.
export async function getToken(): Promise<string | null> {
  const secure = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secure) return secure;
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Convenience: an Authorization header object for fetch, or {} if not signed in.
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem('userId');
}

/**
 * Backend-mediated OAuth that works in Expo Go.
 *
 * 1. Compute a redirect URI the in-app browser can catch. In Expo Go this is an
 *    exp:// URL; in a dev/standalone build it's the convoysync:// scheme.
 * 2. Open the backend's /oauth/<provider> endpoint, passing that redirect URI.
 *    The backend tucks it into the OAuth `state` and, after the provider signs
 *    the user in, redirects back to it with ?token=<jwt>.
 * 3. Parse the token from the returned URL and store it in SecureStore.
 */
export async function signInWithProvider(
  provider: OAuthProvider
): Promise<OAuthResult> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'convoysync' });

    const authUrl = `${API_URL}/oauth/${provider}?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, reason: 'cancelled' };
    }
    if (result.type !== 'success' || !result.url) {
      return { ok: false, reason: 'error', message: 'Login was not completed' };
    }

    const { queryParams } = Linking.parse(result.url);
    const token = queryParams?.token;
    if (!token || typeof token !== 'string') {
      return { ok: false, reason: 'error', message: 'No token returned' };
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return { ok: true, token };
  } catch (err: any) {
    console.error('OAuth error', err);
    return { ok: false, reason: 'error', message: err?.message };
  }
}
