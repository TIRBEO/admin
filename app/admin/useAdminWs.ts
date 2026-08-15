'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export interface AdminWsOptions {
  /** Auto-reconnect on disconnect (default true) */
  autoReconnect?: boolean;
  /** Max reconnect attempts (default 10) */
  maxRetries?: number;
  /** Base reconnect delay in ms (default 2000) */
  baseDelay?: number;
}

interface UseAdminWsReturn {
  /** Most recent message received */
  lastMessage: WsMessage | null;
  /** All messages received (capped at 100) */
  messages: WsMessage[];
  /** Current connection state */
  state: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Send a message to the server */
  send: (data: Record<string, unknown>) => void;
  /** Subscribe to a realtime channel (e.g. 'admin', 'flow:123') */
  subscribe: (channel: string) => void;
  /** Unsubscribe from a realtime channel */
  unsubscribe: (channel: string) => void;
  /** Manually reconnect */
  reconnect: () => void;
}

/**
 * Admin WebSocket hook that:
 * - Connects to NEXT_PUBLIC_WS_URL (defaults to ws://localhost:3001/ws in dev,
 *   wss://ws.tirbeo.app/ws in production — the realtime platform)
 * - Authenticates using the stored auth_token
 * - Subscribes to the 'admin' channel (realtime platform)
 * - Handles ping/pong keep-alive
 * - Auto-reconnects on disconnect
 * - Returns typed message stream
 */
export function useAdminWs(options: AdminWsOptions = {}): UseAdminWsReturn {
  const { autoReconnect = true, maxRetries = 10, baseDelay = 2000 } = options;

  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [state, setState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const getWsUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (wsBase) return wsBase;
    // Fall back to sensible defaults per environment (the API runs on :3001 in dev).
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'ws://localhost:3001/ws' : 'wss://ws.tirbeo.app/ws';
  }, []);

  const cleanup = useCallback(() => {
    if (pingInterval.current) { clearInterval(pingInterval.current); pingInterval.current = null; }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    cleanup();

    const url = getWsUrl();
    if (!url) return;

    try {
      setState('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        // Authenticate
        const token = localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
        retryCount.current = 0;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data) as WsMessage;

          // Handle ping → pong
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // Auth confirmed
          if (msg.type === 'auth_ok') {
            setState('connected');
            // Subscribe to the admin broadcast channel (realtime platform).
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'admin' }));
            // Start ping interval
            pingInterval.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 25000);
            return;
          }

          // Auth error
          if (msg.type === 'auth_error') {
            setState('error');
            return;
          }

          // Rate limit
          if (msg.type === 'rate_limit_exceeded') {
            return;
          }

          // Realtime platform events arrive as { type: 'event', channel, event }.
          // Normalize so consumers keep using msg.type / msg.payload.
          let normalized: WsMessage = msg;
          if (msg.type === 'event' && msg.event && typeof msg.event === 'object') {
            const evt = msg.event as Record<string, unknown>;
            normalized = {
              type: typeof evt.type === 'string' ? evt.type : 'event',
              channel: msg.channel,
              payload: evt.payload ?? evt,
              ...evt,
            } as WsMessage;
          }

          // Control-plane messages that don't carry domain events.
          if (normalized.type === 'subscribed' || normalized.type === 'unsubscribed' || normalized.type === 'presence') {
            return;
          }

          setLastMessage(normalized);
          setMessages(prev => {
            const next = [normalized, ...prev];
            return next.length > 100 ? next.slice(0, 100) : next;
          });
        } catch {
          // Non-JSON message, ignore
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        cleanup();
        setState('disconnected');

        // Auto-reconnect
        if (autoReconnect && retryCount.current < maxRetries && event.code !== 4001 && event.code !== 4003) {
          const delay = Math.min(baseDelay * Math.pow(2, retryCount.current), 30000);
          retryCount.current++;
          retryTimeout.current = setTimeout(() => {
            if (mountedRef.current) connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setState('error');
      };
    } catch {
      setState('error');
    }
  }, [getWsUrl, cleanup, autoReconnect, maxRetries, baseDelay]);

  const reconnect = useCallback(() => {
    retryCount.current = 0;
    connect();
  }, [connect]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    send({ type: 'subscribe', channel });
  }, [send]);

  const unsubscribe = useCallback((channel: string) => {
    send({ type: 'unsubscribe', channel });
  }, [send]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      cleanup();
    };
  }, [connect, cleanup]);

  return { lastMessage, messages, state, send, subscribe, unsubscribe, reconnect };
}
