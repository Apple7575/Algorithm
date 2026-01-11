/**
 * Chrome Storage Utilities
 * Wrapper for chrome.storage.local and chrome.storage.session
 */

import type { ExtensionStorageLocal, ExtensionStorageSession } from '@algo-pt/shared';

// ============================================================
// Local Storage (persists across browser sessions)
// ============================================================

export async function getLocalStorage<K extends keyof ExtensionStorageLocal>(
  key: K
): Promise<ExtensionStorageLocal[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

export async function setLocalStorage<K extends keyof ExtensionStorageLocal>(
  key: K,
  value: ExtensionStorageLocal[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function removeLocalStorage(key: keyof ExtensionStorageLocal): Promise<void> {
  await chrome.storage.local.remove(key);
}

export async function getAllLocalStorage(): Promise<ExtensionStorageLocal> {
  return (await chrome.storage.local.get(null)) as ExtensionStorageLocal;
}

// ============================================================
// Session Storage (persists only during browser session)
// ============================================================

export async function getSessionStorage<K extends keyof ExtensionStorageSession>(
  key: K
): Promise<ExtensionStorageSession[K] | undefined> {
  const result = await chrome.storage.session.get(key);
  return result[key];
}

export async function setSessionStorage<K extends keyof ExtensionStorageSession>(
  key: K,
  value: ExtensionStorageSession[K]
): Promise<void> {
  await chrome.storage.session.set({ [key]: value });
}

export async function removeSessionStorage(key: keyof ExtensionStorageSession): Promise<void> {
  await chrome.storage.session.remove(key);
}

export async function getAllSessionStorage(): Promise<ExtensionStorageSession> {
  return (await chrome.storage.session.get(null)) as ExtensionStorageSession;
}

// ============================================================
// Auth Token Helpers
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken, expiresAt, userId] = await Promise.all([
    getLocalStorage('accessToken'),
    getLocalStorage('refreshToken'),
    getLocalStorage('tokenExpiresAt'),
    getLocalStorage('userId'),
  ]);

  if (!accessToken || !refreshToken || !expiresAt || !userId) {
    return null;
  }

  return { accessToken, refreshToken, expiresAt, userId };
}

export async function setAuthTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    setLocalStorage('accessToken', tokens.accessToken),
    setLocalStorage('refreshToken', tokens.refreshToken),
    setLocalStorage('tokenExpiresAt', tokens.expiresAt),
    setLocalStorage('userId', tokens.userId),
  ]);
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    removeLocalStorage('accessToken'),
    removeLocalStorage('refreshToken'),
    removeLocalStorage('tokenExpiresAt'),
    removeLocalStorage('userId'),
  ]);
}

export function isTokenExpired(expiresAt: number): boolean {
  // Consider expired 5 minutes before actual expiry
  return Date.now() > (expiresAt - 5 * 60 * 1000);
}
