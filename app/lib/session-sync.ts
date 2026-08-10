'use client';

const CHANNEL_NAME = 'tirbeo-session-sync';
const STORAGE_KEY = 'tirbeo-session-state';

export type SessionEvent = 
  | { type: 'login'; userId: string; timestamp: number }
  | { type: 'logout'; timestamp: number }
  | { type: 'refresh'; timestamp: number }
  | { type: 'session-invalid'; timestamp: number };

let channel: BroadcastChannel | null = null;
let listeners: Array<(event: SessionEvent) => void> = [];

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        const data = event.data as SessionEvent;
        listeners.forEach(fn => fn(data));
      };
    } catch {
      return null;
    }
  }
  return channel;
}

export function onSessionEvent(callback: (event: SessionEvent) => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
}

export function broadcastSessionEvent(event: SessionEvent): void {
  const ch = getChannel();
  if (ch) {
    ch.postMessage(event);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.timestamp === event.timestamp) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {}
    }, 1000);
  } catch {}
}

export function notifyLogin(userId: string): void {
  broadcastSessionEvent({ type: 'login', userId, timestamp: Date.now() });
}

export function notifyLogout(): void {
  broadcastSessionEvent({ type: 'logout', timestamp: Date.now() });
}

export function notifyRefresh(): void {
  broadcastSessionEvent({ type: 'refresh', timestamp: Date.now() });
}

export function notifySessionInvalid(): void {
  broadcastSessionEvent({ type: 'session-invalid', timestamp: Date.now() });
}

export function setupVisibilityListener(
  onVisible: () => void,
  intervalMs: number = 30000
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  let intervalId: ReturnType<typeof setInterval> | null = null;
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      onVisible();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      onVisible();
    }
  }, intervalMs);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (intervalId) clearInterval(intervalId);
  };
}
