import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { fetchTimeDisplay } from '../../services/timeApi';
import { toast } from 'react-toastify';

const REFRESH_BUFFER_MS = 1200;
/** Extra query param so the QR bitmap updates on manual refresh when the server still returns the same URL (same time window). Punch only uses `code`. */
const QR_DISPLAY_PARAM = '_ui';

function withDisplayRev(qrUrl, rev) {
  if (!qrUrl) return '';
  try {
    const u = new URL(qrUrl);
    u.searchParams.set(QR_DISPLAY_PARAM, String(rev));
    return u.toString();
  } catch {
    return qrUrl;
  }
}

/** Workshop wall / tablet: rotating QR, optional fullscreen, auto-refresh at window rollover. */
const TimeDisplay = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [validUntil, setValidUntil] = useState(null);
  const [error, setError] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [qrDisplayRev, setQrDisplayRev] = useState(0);

  const lastServerQrRef = useRef('');
  const rolloverTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const qrFrameRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const setSizeFromMq = () => setQrSize(mq.matches ? 228 : 288);
    setSizeFromMq();
    mq.addEventListener('change', setSizeFromMq);

    const onFullscreen = () =>
      setQrFullscreen(document.fullscreenElement === qrFrameRef.current);
    document.addEventListener('fullscreenchange', onFullscreen);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      mq.removeEventListener('change', setSizeFromMq);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const load = useCallback(async ({ showErrorToast = false } = {}) => {
    try {
      setError('');
      const data = await fetchTimeDisplay();
      const nextUrl = data.qrUrl;
      setQrUrl(nextUrl);
      setValidUntil(new Date(data.validUntil));

      if (nextUrl === lastServerQrRef.current) {
        setQrDisplayRev((r) => r + 1);
      }
      lastServerQrRef.current = nextUrl;

      return true;
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Could not load QR';
      setError(msg);
      if (showErrorToast) toast.error(msg);
      return false;
    }
  }, []);

  useEffect(() => {
    load({ showErrorToast: true });
  }, [load]);

  useEffect(() => {
    if (!validUntil) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      setSecondsLeft(
        Math.max(0, Math.ceil((validUntil.getTime() - Date.now()) / 1000)),
      );
    };
    tick();
    countdownIntervalRef.current = window.setInterval(tick, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [validUntil]);

  useEffect(() => {
    if (!validUntil) return;

    const delay = Math.max(0, validUntil.getTime() - Date.now() + REFRESH_BUFFER_MS);
    rolloverTimerRef.current = window.setTimeout(() => load(), delay);

    return () => {
      if (rolloverTimerRef.current) clearTimeout(rolloverTimerRef.current);
    };
  }, [validUntil, load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const ok = await load({ showErrorToast: true });
    if (ok) toast.success('QR updated');
    setIsRefreshing(false);
  };

  const toggleFullscreen = async () => {
    const el = qrFrameRef.current;
    if (!el?.requestFullscreen) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* unsupported or denied */
    }
  };

  const healthy = isOnline && !error;
  const qrFrameClassName = [
    'rounded-3xl bg-white p-4 sm:p-6 shadow-[0_4px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_40px_rgba(0,0,0,0.45)] ring-1 ring-gray-200/80 dark:ring-white/10',
    'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/40 dark:focus-visible:ring-white/30',
    qrFullscreen &&
      'min-h-screen w-full max-w-none flex flex-col items-center justify-center rounded-none p-6 sm:p-10 bg-gradient-to-b from-gray-100 via-gray-50 to-white dark:from-[#0c0d10] dark:via-[#0a0a0b] dark:to-[#111318]',
  ]
    .filter(Boolean)
    .join(' ');

  const qrValue = withDisplayRev(qrUrl, qrDisplayRev);

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-gradient-to-b from-gray-100/90 via-gray-50 to-white dark:from-[#0c0d10] dark:via-[#0a0a0b] dark:to-[#111318]">
      <div className="w-full max-w-md mx-auto flex flex-col items-stretch text-center">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-brand-dark/70 dark:text-white/50 mb-2">
          Workshop time clock
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark dark:text-white tracking-tight mb-2">
          Check in / out
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
          Scan to check in or out.
        </p>
        <p className="mt-2 flex justify-center">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              healthy
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {healthy ? 'Online' : 'Connection issue'}
          </span>
        </p>

        {error && !qrUrl && (
          <div className="mt-8 rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/90 dark:bg-red-950/35 px-4 py-4 text-left text-sm text-red-800 dark:text-red-100 shadow-sm">
            <p className="font-medium mb-2">Couldn’t load the QR code</p>
            <p className="text-red-700/90 dark:text-red-200/90 mb-3">{error}</p>
            <button
              type="button"
              onClick={() => load({ showErrorToast: true })}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 transition"
            >
              Try again
            </button>
          </div>
        )}

        {qrUrl && (
          <div className="mt-4 flex flex-col items-center gap-5">
            <div className="relative w-full flex justify-center">
              <div
                ref={qrFrameRef}
                role="button"
                tabIndex={0}
                aria-label="Show QR fullscreen"
                onClick={toggleFullscreen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFullscreen();
                  }
                }}
                className={qrFrameClassName}
                style={qrFullscreen ? undefined : { maxWidth: 'min(100%, 340px)' }}
              >
                <div className="rounded-2xl overflow-hidden bg-white flex items-center justify-center shrink-0">
                  <QRCode value={qrValue} size={qrSize} fgColor="#111827" bgColor="#ffffff" level="M" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">Tap QR for fullscreen</p>

            {secondsLeft !== null && secondsLeft > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                Next code in <span className="font-semibold text-gray-700 dark:text-gray-300">{secondsLeft}s</span>
              </p>
            )}

            <div className="w-full max-w-xs mx-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-gray-200 dark:border-white/15 bg-white/80 dark:bg-white/5 text-brand-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/25 transition shadow-sm disabled:opacity-60"
              >
                <RefreshIcon />
                {isRefreshing ? 'Refreshing...' : 'Refresh QR now'}
              </button>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                Use if the screen was offline or the code looks stale.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export default TimeDisplay;
