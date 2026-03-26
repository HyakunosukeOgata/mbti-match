/**
 * Apple Sign-In integration via Capacitor
 * 
 * On native iOS: uses @capacitor-community/apple-sign-in plugin
 * On web: returns an unavailable error because Apple Sign-In requires native context here
 */

import { Capacitor } from '@capacitor/core';

export interface AppleSignInResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string | null;
  };
  error?: string;
}

/**
 * Check if Apple Sign-In is available (native iOS only)
 */
export function isAppleSignInAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Perform Apple Sign-In
 * Returns user info if successful
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isAppleSignInAvailable()) {
    return {
      success: false,
      error: 'Apple Sign-In 僅在 iOS 裝置上可用',
    };
  }

  try {
    // Dynamic import to avoid issues on web builds
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

    const result = await SignInWithApple.authorize({
      clientId: 'com.mochi.match',
      redirectURI: '',
      scopes: 'name email',
      state: '',
      nonce: '',
    });

    const response = result.response;

    // Apple only returns name/email on FIRST sign-in
    // After that, only identityToken & user ID are returned
    const givenName = response.givenName || '';
    const familyName = response.familyName || '';
    const displayName = givenName
      ? `${givenName}${familyName ? ' ' + familyName : ''}`
      : 'Apple 用戶';

    return {
      success: true,
      user: {
        id: `apple-${response.user}`,
        name: displayName,
        email: response.email || null,
      },
    };
  } catch (err: unknown) {
    // User cancelled or auth failed
    const message = err instanceof Error ? err.message : '登入失敗';

    // ASAuthorizationError.canceled = 1001
    if (message.includes('1001') || message.includes('cancel')) {
      return { success: false, error: '已取消登入' };
    }

    return { success: false, error: `Apple 登入失敗：${message}` };
  }
}
