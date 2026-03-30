'use client';

export interface ProfileBioSourceMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PROFILE_BIO_SOURCE_KEY = 'mochi_profile_bio_source';

export function saveProfileBioSource(messages: ProfileBioSourceMessage[]) {
  try {
    window.localStorage.setItem(PROFILE_BIO_SOURCE_KEY, JSON.stringify({ messages }));
  } catch {
    // ignore storage failures
  }
}

export function loadProfileBioSource(): ProfileBioSourceMessage[] {
  try {
    const raw = window.localStorage.getItem(PROFILE_BIO_SOURCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { messages?: ProfileBioSourceMessage[] };
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

export function clearProfileBioSource() {
  try {
    window.localStorage.removeItem(PROFILE_BIO_SOURCE_KEY);
  } catch {
    // ignore storage failures
  }
}