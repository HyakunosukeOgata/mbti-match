'use client';

import { supabase } from './supabase';

export type EventName =
  | 'page_view'
  | 'login'
  | 'logout'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'ai_chat_reset'
  | 'card_like'
  | 'card_skip'
  | 'match_created'
  | 'chat_message_sent'
  | 'chat_image_sent'
  | 'profile_updated'
  | 'ai_chat_complete'
  | 'pwa_install_prompt'
  | 'pwa_installed'
  | 'apple_sign_in'
  | 'report_user';

interface AnalyticsEvent {
  name: EventName;
  props?: Record<string, string | number | boolean>;
  ts: number;
}

const STORAGE_KEY = 'mochi_analytics';
const MAX_EVENTS = 500;

async function uploadEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;

  const { data: { session } } = await supabase.auth.getSession();
  await fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify(event),
  }).catch(() => undefined);
}

function getEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]) {
  try {
    // Keep only last MAX_EVENTS
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — drop oldest half
    try {
      const half = events.slice(-Math.floor(MAX_EVENTS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch { /* give up silently */ }
  }
}

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  // Respect GDPR analytics consent
  if (typeof window !== 'undefined' && localStorage.getItem('mochi_analytics_consent') !== 'true') return;
  const event: AnalyticsEvent = { name, ts: Date.now(), ...(props ? { props } : {}) };
  const events = getEvents();
  events.push(event);
  saveEvents(events);
  void uploadEvent(event);
}

export function getAnalyticsSummary() {
  const events = getEvents();
  if (events.length === 0) return null;

  const now = Date.now();
  const today = events.filter(e => now - e.ts < 86400000);
  const week = events.filter(e => now - e.ts < 604800000);

  const count = (list: AnalyticsEvent[], name: EventName) =>
    list.filter(e => e.name === name).length;

  return {
    total: events.length,
    today: {
      pageViews: count(today, 'page_view'),
      likes: count(today, 'card_like'),
      skips: count(today, 'card_skip'),
      matches: count(today, 'match_created'),
      messages: count(today, 'chat_message_sent') + count(today, 'chat_image_sent'),
    },
    week: {
      pageViews: count(week, 'page_view'),
      likes: count(week, 'card_like'),
      skips: count(week, 'card_skip'),
      matches: count(week, 'match_created'),
      messages: count(week, 'chat_message_sent') + count(week, 'chat_image_sent'),
    },
    firstEvent: events[0]?.ts,
    lastEvent: events[events.length - 1]?.ts,
  };
}

export function clearAnalytics() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
