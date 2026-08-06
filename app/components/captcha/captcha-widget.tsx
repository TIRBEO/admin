'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API } from '../../lib';

interface CaptchaChallenge {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  challengeType: string;
  question: string;
  data?: any;
  rayId: string;
  attempts: number;
  token: string;
}

interface BehaviorSample {
  t: number;
  x: number;
  y: number;
}

interface BehaviorKey {
  t: number;
  hold: number;
  gap: number;
}

interface BehaviorData {
  startedAt?: number;
  submittedAt?: number;
  samples?: BehaviorSample[];
  keys?: BehaviorKey[];
  scrollCount?: number;
  focusBlurs?: number;
  clicks?: number;
  screen?: string;
  dpr?: number;
  jsEnabled?: boolean;
  reducedMotion?: boolean;
  touch?: boolean;
}

interface BlockInfo {
  rayId: string;
  reason: string;
  expiresAt?: string;
  blockedAt?: string;
}

interface CaptchaWidgetProps {
  onSuccess?: (rayId: string) => void;
  onBlocked?: (rayId: string, reason: string, expiresAt?: string) => void;
  requiredDifficulty?: string;
  forceShow?: boolean;
  apiBase?: string;
  autoShow?: boolean;
  blockPageUrl?: string;
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  let out = '';
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
    out += (h & 0xff).toString(16);
  }
  return out.padEnd(64, '0');
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function buildFingerprintSource(): string {
  return [
    navigator.userAgent,
    navigator.language,
    (navigator as any).platform || '',
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    window.devicePixelRatio || 1,
    'ontouchstart' in window,
  ].join('|');
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'border-[var(--success)] bg-[var(--success-surface)]',
  medium: 'border-[var(--warning)] bg-[var(--warning-surface)]',
  hard: 'border-[var(--error)] bg-[var(--error-surface)]',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'text-[var(--success)]',
  medium: 'text-[var(--warning)]',
  hard: 'text-[var(--error)]',
};

const WIDGET_CSS = `
@keyframes tirbeo-tick-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.tirbeo-tick-pop { animation: tirbeo-tick-pop 0.35s ease-out; transform-origin: center; }
`;

export function CaptchaWidget({
  onSuccess,
  onBlocked,
  requiredDifficulty,
  forceShow = false,
  apiBase = `${API}/api/captcha`,
  autoShow = true,
  blockPageUrl,
}: CaptchaWidgetProps) {
  // state: 'idle' (checkbox shown) | 'checking' | 'hidden' | 'ready' | 'solved' | 'blocked' | 'error'
  const [state, setState] = useState<'checking' | 'idle' | 'hidden' | 'ready' | 'solved' | 'blocked' | 'error'>('checking');
  const [modalOpen, setModalOpen] = useState(false);
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [risk, setRisk] = useState<{ score: number; level: string } | null>(null);
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [imageFailed, setImageFailed] = useState<Record<number, boolean>>({});
  const [typed, setTyped] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [singlePick, setSinglePick] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [memoryPhase, setMemoryPhase] = useState<'reveal' | 'pick'>('reveal');

  const fingerprintRef = useRef<string>('');
  const behaviorRef = useRef<BehaviorData>({ startedAt: Date.now(), samples: [], keys: [], scrollCount: 0, focusBlurs: 0, clicks: 0 });
  const keyDownAtRef = useRef(0);
  const onSuccessRef = useRef(onSuccess);
  const onBlockedRef = useRef(onBlocked);
  onSuccessRef.current = onSuccess;
  onBlockedRef.current = onBlocked;

  const finalizeBehavior = useCallback((): BehaviorData => {
    const b = behaviorRef.current;
    return { ...b, submittedAt: Date.now() };
  }, []);

  const startBehaviorCapture = useCallback(() => {
    const b = behaviorRef.current;
    b.samples = [];
    b.keys = [];
    b.scrollCount = 0;
    b.focusBlurs = 0;
    b.clicks = 0;
    b.startedAt = Date.now();
    b.screen = `${screen.width}x${screen.height}`;
    b.dpr = window.devicePixelRatio || 1;
    b.jsEnabled = true;
    b.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    b.touch = 'ontouchstart' in window;

    const onMove = (e: PointerEvent) => {
      const samples = behaviorRef.current.samples;
      if (!samples || samples.length > 120) return;
      const now = Date.now();
      const last = samples[samples.length - 1];
      if (last && now - last.t < 40) return;
      samples.push({ t: now, x: e.clientX, y: e.clientY });
    };
    const onKeyDown = (e: KeyboardEvent) => { keyDownAtRef.current = Date.now(); };
    const onKeyUp = () => {
      const keys = behaviorRef.current.keys;
      if (!keys || keys.length > 80) return;
      const now = Date.now();
      const last = keys[keys.length - 1];
      keys.push({ t: now, hold: keyDownAtRef.current ? Math.max(0, now - keyDownAtRef.current) : 0, gap: last ? now - last.t : 0 });
    };
    const onScroll = () => { behaviorRef.current.scrollCount = (behaviorRef.current.scrollCount || 0) + 1; };
    const onBlur = () => { behaviorRef.current.focusBlurs = (behaviorRef.current.focusBlurs || 0) + 1; };
    const onClick = () => { behaviorRef.current.clicks = (behaviorRef.current.clicks || 0) + 1; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('keyup', onKeyUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onBlur);
    document.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const openBlocked = useCallback((data: BlockInfo) => {
    setBlockInfo(data);
    setState('blocked');
    setModalOpen(false);
    onBlockedRef.current?.(data.rayId, data.reason, data.expiresAt);
  }, []);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setError('');
    setImageFailed({});
    try {
      const headers: Record<string, string> = {};
      if (fingerprintRef.current) headers['x-device-fingerprint'] = fingerprintRef.current;
      const res = await fetch(`${apiBase}/challenge`, { credentials: 'include', headers });
      const data = await res.json();
      if (data.blocked) {
        openBlocked({ rayId: data.rayId, reason: data.reason || 'blocked', expiresAt: data.expiresAt, blockedAt: data.blockedAt });
        return;
      }
      if (!data.challenge) {
        setError(data.error || 'Failed to load CAPTCHA');
        setState('error');
        return;
      }
      setChallenge(data.challenge);
      setSelectedAnswer('');
      setSelected([]);
      setSinglePick(null);
      setAnswerText('');
      setImageFailed({});
      setMemoryPhase('reveal');
      setRisk(data.risk ? { score: data.risk.score, level: data.risk.level } : null);
      setState('ready');
    } catch (err: any) {
      setError(err?.message || 'Failed to load CAPTCHA');
      setState('error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, openBlocked]);

  const openChallengeRef = useRef<() => void>(() => {});
  openChallengeRef.current = () => {
    setModalOpen(true);
    if (!challengeRef.current) loadChallengeRef.current();
  };
  const challengeRef = useRef<CaptchaChallenge | null>(null);
  challengeRef.current = challenge;
  const loadChallengeRef = useRef<() => Promise<void>>(async () => {});
  loadChallengeRef.current = loadChallenge;
  const openChallenge = useCallback(() => {
    openChallengeRef.current();
  }, []);

  const closeModal = useCallback(() => {
    if (state === 'solved') return; // keep solved locked in
    setModalOpen(false);
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    let stopCapture = () => {};
    (async () => {
      const cookieFp = getCookie('__dfp');
      const fp = cookieFp || (await sha256Hex(buildFingerprintSource()));
      fingerprintRef.current = fp;
      if (!cookieFp && typeof document !== 'undefined') {
        document.cookie = `__dfp=${encodeURIComponent(fp)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      stopCapture = startBehaviorCapture();

      if (forceShow) {
        // Suspect/interaction triggered: go straight to the checkbox, and auto-open if requested.
        setState('idle');
        setLoading(false);
        if (autoShow) await openChallenge();
        return;
      }
      try {
        const statusRes = await fetch(`${apiBase}/status`, { credentials: 'include' });
        const status = await statusRes.json();
        if (cancelled) return;
        if (status.blocked) {
          openBlocked({ rayId: status.rayId || '', reason: status.reason || 'blocked', expiresAt: status.expiresAt, blockedAt: status.blockedAt });
          return;
        }
        const forcedDifficulty = requiredDifficulty ? requiredDifficulty !== 'easy' : false;
        if (!status.captchaEnabled && !forcedDifficulty) {
          setState('hidden');
          onSuccessRef.current?.('');
          return;
        }
        if (!status.requireCaptcha && !forcedDifficulty) {
          setState('hidden');
          onSuccessRef.current?.('');
          return;
        }
        // Captcha required: show the real checkbox widget.
        setState('idle');
        setLoading(false);
        if (autoShow) await openChallenge();
      } catch {
        setState('idle');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; stopCapture(); };
  }, [autoShow, forceShow, requiredDifficulty, apiBase, loadChallenge, startBehaviorCapture, openBlocked, openChallenge]);

  useEffect(() => {
    if (!challenge || state !== 'ready') return;
    setTyped('');
    let i = 0;
    const timer = window.setInterval(() => {
      i += 2;
      setTyped(challenge.question.slice(0, i));
      if (i >= challenge.question.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [challenge, state]);

  // Memory challenge: reveal highlighted tiles, then hide them and let the user pick
  useEffect(() => {
    if (!challenge || state !== 'ready') return;
    setMemoryPhase('reveal');
    if (challenge.type === 'memory') {
      const t = window.setTimeout(() => setMemoryPhase('pick'), 3200);
      return () => window.clearTimeout(t);
    }
  }, [challenge, state]);

  const buildAnswer = (): string => {
    if (!challenge) return '';
    const t = challenge.type || challenge.challengeType;
    if (t === 'text') return answerText.trim();
    if (t === 'image-select' || t === 'memory') return [...selected].sort((a, b) => a - b).join(',');
    if (t === 'image-single' || t === 'image-odd' || t === 'color' || t === 'shape') return singlePick !== null ? String(singlePick) : '';
    return selectedAnswer;
  };

  const handleVerify = async () => {
    if (!challenge) return;
    const answer = buildAnswer();
    if (!answer) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-fingerprint': fingerprintRef.current },
        credentials: 'include',
        body: JSON.stringify({
          challengeId: challenge.id,
          answer,
          token: challenge.token,
          behavior: finalizeBehavior(),
          fingerprint: fingerprintRef.current,
        }),
      });
      const data = await res.json();
      if (data.blocked) {
        openBlocked({ rayId: data.rayId, reason: data.reason || 'blocked', expiresAt: data.expiresAt, blockedAt: data.blockedAt });
        return;
      }
      if (data.valid) {
        if (data.nextRequired) {
          setSelectedAnswer('');
          setSelected([]);
          setSinglePick(null);
          setAnswerText('');
          await loadChallenge();
          return;
        }
        setState('solved');
        setModalOpen(false);
        onSuccessRef.current?.(data.rayId);
      } else {
        setError(data.reason || 'Incorrect answer. Please try again.');
        setSelectedAnswer('');
        setSelected([]);
        setSinglePick(null);
        setAnswerText('');
        if (data.reason && /expired|token|mismatch|already used/i.test(data.reason)) {
          await loadChallenge();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const blockedUrl = (() => {
    if (blockPageUrl) return blockPageUrl;
    const params = new URLSearchParams();
    if (blockInfo?.rayId) params.set('rayId', blockInfo.rayId);
    if (blockInfo?.reason) params.set('reason', blockInfo.reason);
    if (blockInfo?.expiresAt) params.set('expiresAt', blockInfo.expiresAt);
    if (blockInfo?.blockedAt) params.set('blockedAt', blockInfo.blockedAt);
    const qs = params.toString();
    return `/captcha/blocked${qs ? `?${qs}` : ''}`;
  })();

  const renderChallenge = () => {
    if (!challenge) return null;
    const d = challenge.data || {};
    const t = challenge.type || challenge.challengeType;

    const img = (src: string, idx: number) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover select-none"
        onError={() => setImageFailed(f => ({ ...f, [idx]: true }))}
      />
    );

    if (t === 'text') {
      return (
        <div className="mb-4">
          <div
            className="mb-3 select-none text-center font-mono text-2xl font-bold tracking-[0.3em]"
            style={{ color: d.color || undefined, transform: `rotate(${d.rotation || 0}deg)` }}
          >
            {d.text || '????'}
          </div>
          <input
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            placeholder="Type the text above"
            autoFocus
            className="w-full rounded-lg border-2 border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
          />
        </div>
      );
    }

    if (t === 'memory') {
      const tiles: { highlight: boolean }[] = d.tiles || [];
      const highlightCount = tiles.filter(tl => tl.highlight).length;
      const cols = tiles.length <= 9 ? 3 : 4;
      return (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs text-[var(--text-muted)]">
            {memoryPhase === 'reveal' ? 'Memorize the highlighted tiles…' : `Click the ${highlightCount} tiles you memorized`}
          </p>
          <div className={`grid gap-1.5 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {tiles.map((tile, idx) => {
              const isSelected = selected.includes(idx);
              const showHighlight = memoryPhase === 'reveal' && tile.highlight;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={memoryPhase === 'reveal'}
                  onClick={() => setSelected(s => (s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]))}
                  className={`aspect-square rounded-lg border-2 transition-all ${isSelected ? 'border-[var(--primary)] bg-[var(--primary-surface)]' : 'border-[var(--border)] bg-[var(--bg-surface)]'} ${showHighlight ? '!border-[var(--primary)] !bg-[var(--primary)]' : ''}`}
                />
              );
            })}
          </div>
        </div>
      );
    }

    if (t === 'image-select' || t === 'image-single' || t === 'image-odd') {
      const images: string[] = d.images || [];
      return (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs text-[var(--text-muted)]">
            {t === 'image-select' ? `Select all images with ${String(d.category || '').replace(/_/g, ' ')}` : t === 'image-single' ? 'Click the image that matches' : 'Click the image that does not belong'}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((src, idx) => {
              const isSel = t === 'image-select' ? selected.includes(idx) : singlePick === idx;
              const failed = imageFailed[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (t === 'image-select') setSelected(s => (s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]));
                    else setSinglePick(idx);
                  }}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${isSel ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
                >
                  {failed ? (
                    <span className="flex h-full w-full items-center justify-center bg-[var(--bg-muted)] text-[10px] text-[var(--text-muted)]">image</span>
                  ) : (
                    img(src, idx)
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (t === 'color') {
      const colors: string[] = d.colors || [];
      return (
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2.5">
            {colors.map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSinglePick(idx)}
                aria-label={`color ${idx + 1}`}
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${singlePick === idx ? 'scale-110 border-[var(--text)]' : 'border-transparent hover:scale-105'}`}
                style={{ background: c }}
              >
                {singlePick === idx && <span className="text-lg text-white drop-shadow">✓</span>}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (t === 'shape') {
      const shapes: string[] = d.shapes || [];
      return (
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2.5">
            {shapes.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSinglePick(idx)}
                className={`flex h-14 w-14 items-center justify-center  border-2 text-3xl transition-all ${singlePick === idx ? 'scale-110 border-[var(--primary)] bg-[var(--primary-surface)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (t === 'emoji') {
      const emojis: string[] = d.emojis || [];
      const options: string[] = d.options || ['1', '2', '3', '4', '5', '6'];
      return (
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-1 rounded-lg bg-[var(--bg-surface)] p-3">
            {emojis.map((e, idx) => (
              <span key={idx} className="text-2xl">{e}</span>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedAnswer(opt)}
                className={`p-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${selectedAnswer === opt ? 'border-[var(--primary)] bg-[var(--primary-surface)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // options-based types: math, word, logic
    const options: string[] = d.options || [];
    return (
      <div className="mb-4">
        {t === 'word' && d.scrambled && (
          <p className="mb-3 text-center font-mono text-xl font-bold tracking-[0.35em] text-[var(--text)]">{d.scrambled}</p>
        )}
        {t === 'logic' && d.sequence && (
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {(d.sequence as string[]).map((s, idx) => (
              <span
                key={idx}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${s === '?' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text)]'}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(option)}
              className={`p-3 rounded-lg border-2 transition-all ${selectedAnswer === option ? 'border-[var(--primary)] bg-[var(--primary-surface)]' : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Blocked state: a clear panel with the Ray ID and appeal path ──
  if (state === 'blocked') {
    return (
      <div className="p-4  border-2 border-[var(--error)] bg-[var(--error-surface)] text-sm">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-[var(--error)] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="min-w-0">
            <p className="font-medium text-[var(--error)]">Access temporarily blocked</p>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              {error || 'Too many failed attempts or suspicious activity was detected. Your access has been paused for a short while.'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
              <span>Ray ID: <code className="font-mono">{blockInfo?.rayId ? blockInfo.rayId.slice(0, 24) : 'unknown'}…</code></span>
              <span>Reported to admins for review</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={blockedUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                View block details & appeal
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'solved') {
    return (
      <div className="w-full flex items-center gap-3  border-2 border-[var(--success)] bg-[var(--success-surface)] px-4 py-3 transition-all">
        <style>{WIDGET_CSS}</style>
        <span className="tirbeo-tick-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-white">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--success)]">Verified — you are human!</span>
          <span className="block text-[11px] text-[var(--text-muted)]">Verification complete · access granted</span>
        </span>
        <svg className="ml-auto h-5 w-5 shrink-0 text-[var(--success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    );
  }

  if (state === 'hidden') return null;

  // ── Checkbox container (like reCAPTCHA/Turnstile) ──
  return (
    <div>
      <style>{WIDGET_CSS}</style>
      <button
        type="button"
        onClick={() => openChallenge()}
        disabled={state === 'checking' || loading}
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        className="group w-full flex items-center gap-3  border-2 border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-all hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)] active:scale-[0.995] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <span
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
            state === 'checking' || loading
              ? 'border-[var(--primary)]/40'
              : modalOpen
                ? 'border-[var(--primary)] bg-[var(--primary-surface)]'
                : 'border-[var(--text-muted)] group-hover:border-[var(--primary)]'
          }`}
        >
          {state === 'checking' || loading ? (
            <>
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              <span className="absolute inset-0 rounded-full border border-[var(--primary)]/20" />
            </>
          ) : (
            <svg className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 transition-opacity duration-200 group-hover:opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--text)]">Verify you are a human!</span>
          <span className="block text-[11px] text-[var(--text-muted)]">{state === 'ready' || modalOpen ? 'Complete the challenge in the popup' : 'Click the checkbox to verify'}</span>
        </span>
        <svg className="ml-auto h-5 w-5 shrink-0 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </button>

      {error && state === 'error' && (
        <div className="mt-2 p-3 bg-[var(--error-surface)] border border-[var(--error)] rounded-lg text-[13px] text-[var(--error)]">
          {error}
          <button onClick={() => { setState('idle'); setError(''); openChallenge(); }} className="ml-2 text-[var(--primary)] underline">Retry</button>
        </div>
      )}

      {/* ── Challenge popup (portaled so it escapes transformed/clipped ancestors) ── */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="captcha-dialog-title"
            className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div>
                  <p id="captcha-dialog-title" className="text-sm font-semibold text-[var(--text)]">Human verification</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Tirbeo Security</p>
                </div>
              </div>
              <button onClick={closeModal} aria-label="Close" className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {state === 'checking' || (loading && !challenge) ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                  <p className="text-xs text-[var(--text-muted)]">Preparing challenge…</p>
                </div>
              ) : challenge ? (
                <>
                  <div className={`p-4  border-2 ${DIFFICULTY_STYLES[challenge.difficulty] || DIFFICULTY_STYLES.easy}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium uppercase tracking-wider ${DIFFICULTY_LABEL[challenge.difficulty] || DIFFICULTY_LABEL.easy}`}>
                        {challenge.difficulty} verification
                      </span>
                      {risk && <span className="text-[11px] text-[var(--text-muted)]">risk {risk.score}/100 · {risk.level}</span>}
                    </div>

                    <div className="bg-[var(--bg)] rounded-lg p-3 mb-4">
                      <p className="text-[15px] font-medium text-center text-[var(--text)] min-h-[20px]">
                        {typed || challenge.question}
                      </p>
                    </div>

                    {renderChallenge()}
                  </div>

                  {error && (
                    <div className="mt-3 p-3 bg-[var(--error-surface)] border border-[var(--error)] rounded-lg text-[13px] text-[var(--error)]">
                      {error}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={loadChallenge}
                      disabled={verifying}
                      className="text-xs text-[var(--primary)] hover:opacity-80 underline disabled:opacity-50"
                    >
                      New challenge
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--text-muted)]">attempts {challenge.attempts}/3</span>
                      <button
                        onClick={handleVerify}
                        disabled={!buildAnswer() || verifying}
                        className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition-all disabled:opacity-40"
                        style={{ background: 'var(--text)', boxShadow: '3px 3px 0 0 var(--border)' }}
                      >
                        {verifying ? 'Verifying…' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-center mt-3 text-[var(--text-muted)]">
                    Ray ID: <code className="font-mono">{challenge.rayId.slice(0, 16)}…</code>
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-sm text-[var(--error)]">
                  {error || 'Failed to load CAPTCHA'}
                  <button onClick={loadChallenge} className="ml-2 text-[var(--primary)] underline">Retry</button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
