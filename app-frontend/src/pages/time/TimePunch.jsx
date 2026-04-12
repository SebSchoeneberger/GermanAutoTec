import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { postTimePunch, fetchMyTodayDetail } from '../../services/timeApi';
import { toast } from 'react-toastify';
import { canAccessMyTime } from '../../utils/timeAccess';

const AUTO_REDIRECT_SECONDS = 10;

function playSuccessFeedback() {
  try {
    navigator.vibrate?.([40, 30, 40]);
  } catch {
    /* ignore */
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    ctx.resume?.();
    setTimeout(() => ctx.close?.(), 300);
  } catch {
    /* ignore */
  }
}

function rateLimitMessage(err) {
  if (err?.response?.status === 429) {
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Too many check-in attempts. Please wait about a minute and try again.'
    );
  }
  return null;
}

/** Glanceable status from API `todayStatus`: checked_in | checked_out | none */
function TodayStatusStrip({ todayStatus }) {
  if (todayStatus === 'checked_in') {
    return (
      <div className="rounded-xl overflow-hidden border border-emerald-200/90 dark:border-emerald-800/45 bg-gradient-to-br from-emerald-50/95 to-white dark:from-emerald-950/35 dark:to-transparent">
        <div className="flex min-h-[4.5rem]">
          <div className="w-1 shrink-0 bg-emerald-500" aria-hidden />
          <div className="flex-1 px-3.5 py-3 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                In · at work
              </span>
            </div>
            <p className="mt-1 text-lg font-bold tracking-tight text-emerald-950 dark:text-emerald-50 text-center">
              Clock out next
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (todayStatus === 'checked_out') {
    return (
      <div className="rounded-xl overflow-hidden border border-sky-200/90 dark:border-sky-800/45 bg-gradient-to-br from-sky-50/95 to-white dark:from-sky-950/30 dark:to-transparent">
        <div className="flex min-h-[4.5rem]">
          <div className="w-1 shrink-0 bg-sky-500" aria-hidden />
          <div className="flex-1 px-3.5 py-3 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Out
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold tracking-tight text-sky-950 dark:text-sky-50 text-center">
              Clock in next
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (todayStatus === 'none') {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200/90 dark:border-white/15 bg-gradient-to-br from-slate-50/95 to-white dark:from-white/[0.06] dark:to-transparent">
        <div className="flex min-h-[4.5rem]">
          <div className="w-1 shrink-0 bg-slate-400 dark:bg-slate-500" aria-hidden />
          <div className="flex-1 px-3.5 py-3 flex flex-col justify-center">
            <span className="inline-flex w-fit mx-auto items-center rounded-md bg-slate-600 dark:bg-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Off clock
            </span>
            <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white text-center">
              Clock in next
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/** Updates local status from punch response `data.type`: in | out */
function todayStatusFromPunchType(type) {
  if (type === 'in') return 'checked_in';
  if (type === 'out') return 'checked_out';
  return null;
}

const TimePunch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromQuery = searchParams.get('code');

  const [flow, setFlow] = useState('idle'); // idle | loading | ok | err
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [autoRedirectLeft, setAutoRedirectLeft] = useState(null);
  /** Server-aligned snapshot for today (same as /time/me/today). */
  const [todayStatus, setTodayStatus] = useState(null);
  const [ethiopianWorkDate, setEthiopianWorkDate] = useState('');

  const ranQuery = useRef(false);
  const todayFetchGen = useRef(0);
  const submittingRef = useRef(false);
  const skipAutoRedirectRef = useRef(false);
  const autoRedirectIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const manualInputRef = useRef(null);

  const loading = flow === 'loading';

  const stopScanner = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const extractCode = (rawValue) => {
    const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!raw) return '';
    try {
      return new URL(raw).searchParams.get('code') || raw;
    } catch {
      return raw;
    }
  };

  const submitPunch = async (rawCode) => {
    if (submittingRef.current) return;

    const code = extractCode(rawCode);
    if (!code) {
      setFlow('err');
      setMessage('Missing code. Scan the QR on the workshop screen.');
      return;
    }

    submittingRef.current = true;
    setFlow('loading');
    try {
      const res = await postTimePunch(code);
      const next = todayStatusFromPunchType(res.data?.type);
      todayFetchGen.current += 1;
      if (next) setTodayStatus(next);

      setFlow('ok');
      setMessage(res.message || 'Done');
      toast.success(res.message || 'Recorded');
      playSuccessFeedback();
    } catch (e) {
      setFlow('err');
      const msg =
        rateLimitMessage(e) ||
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Request failed';
      setMessage(msg);
      toast.error(msg);
    } finally {
      submittingRef.current = false;
    }
  };

  const startScanner = async () => {
    if (loading || submittingRef.current) return;
    setScannerError('');
    if (!canAccessMyTime(user?.role)) {
      setFlow('err');
      setMessage('Only workshop staff (mechanic, accountant, receptionist) can check in here.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Camera access is not supported in this browser.');
      return;
    }
    if (!window.BarcodeDetector) {
      setScannerError('QR scanning is not supported in this browser. Use your camera app or enter code manually.');
      return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setIsScanning(true);

      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || submittingRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          const value = barcodes?.[0]?.rawValue;
          if (!value) return;
          stopScanner();
          await submitPunch(value);
        } catch {
          /* keep scanning */
        }
      }, 300);
    } catch {
      stopScanner();
      setScannerError('Could not start camera. Check browser camera permissions.');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setManualCode(text.trim());
    } catch {
      toast.info('Could not read clipboard. Use the field’s long-press / keyboard paste.');
      manualInputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!user || !canAccessMyTime(user.role)) return;
    const gen = (todayFetchGen.current += 1);
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchMyTodayDetail();
        if (cancelled || gen !== todayFetchGen.current) return;
        setTodayStatus(d.todayStatus || 'none');
        setEthiopianWorkDate(d.ethiopianWorkDate || '');
      } catch {
        if (cancelled || gen !== todayFetchGen.current) return;
        setTodayStatus(null);
        setEthiopianWorkDate('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!canAccessMyTime(user.role)) {
      setFlow('err');
      setMessage('Only workshop staff (mechanic, accountant, receptionist) can check in here.');
      return;
    }
    if (!codeFromQuery || ranQuery.current) return;
    ranQuery.current = true;
    submitPunch(codeFromQuery);
  }, [user, codeFromQuery]);

  useEffect(() => {
    if (flow !== 'ok') {
      setAutoRedirectLeft(null);
      skipAutoRedirectRef.current = false;
      if (autoRedirectIntervalRef.current) {
        clearInterval(autoRedirectIntervalRef.current);
        autoRedirectIntervalRef.current = null;
      }
      return;
    }

    skipAutoRedirectRef.current = false;
    let left = AUTO_REDIRECT_SECONDS;
    setAutoRedirectLeft(left);

    autoRedirectIntervalRef.current = setInterval(() => {
      left -= 1;
      setAutoRedirectLeft(left);
      if (left <= 0) {
        clearInterval(autoRedirectIntervalRef.current);
        autoRedirectIntervalRef.current = null;
        if (!skipAutoRedirectRef.current) navigate('/time/my');
      }
    }, 1000);

    return () => {
      if (autoRedirectIntervalRef.current) {
        clearInterval(autoRedirectIntervalRef.current);
        autoRedirectIntervalRef.current = null;
      }
    };
  }, [flow, navigate]);

  // Attach the camera stream to the video element after React renders it.
  // videoRef.current is null while isScanning is false (video not in DOM yet),
  // so we defer the srcObject assignment until the element actually mounts.
  useEffect(() => {
    if (isScanning && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isScanning]);

  useEffect(() => () => stopScanner(), []);

  const cancelAutoRedirect = () => {
    skipAutoRedirectRef.current = true;
    setAutoRedirectLeft(null);
    if (autoRedirectIntervalRef.current) {
      clearInterval(autoRedirectIntervalRef.current);
      autoRedirectIntervalRef.current = null;
    }
  };

  if (!user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Signed in';

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center py-10 sm:py-12 px-4 bg-gradient-to-b from-gray-100/90 via-gray-50 to-white dark:from-[#0c0d10] dark:via-[#0a0a0b] dark:to-[#111318]">
      <div className="w-full max-w-md rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#141518]/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.10)] dark:shadow-[0_10px_60px_rgba(0,0,0,0.55)]">
        <header className="text-center mb-6 space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-brand-dark/70 dark:text-white/50">
            Time management
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark dark:text-white tracking-tight">
            Check in / out
          </h1>
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Punching as
            </p>
            <p className="text-base font-semibold text-brand-dark dark:text-white">{displayName}</p>
            {todayStatus != null && <TodayStatusStrip todayStatus={todayStatus} />}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan the workshop QR code to record your punch.
          </p>
          {ethiopianWorkDate ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Ethiopian date: {ethiopianWorkDate}</p>
          ) : null}
          {canAccessMyTime(user?.role) && (
            <p className="text-sm text-center">
              <Link
                to="/time/my#correction"
                className="text-brand-dark/85 dark:text-amber-400/85 hover:underline font-medium"
              >
                Forgot to clock in or out?
              </Link>
            </p>
          )}
        </header>

        {flow === 'idle' && !codeFromQuery && canAccessMyTime(user.role) && (
          <div className="space-y-5">
            {!isScanning ? (
              <button
                type="button"
                onClick={startScanner}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 disabled:opacity-50 disabled:pointer-events-none"
              >
                <CameraIcon />
                Start camera scan
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-black/20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200/60 dark:border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Scanner</p>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      Live
                    </span>
                  </div>
                  <div className="p-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-gray-200 dark:border-white/10"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Point your camera at the QR on the workshop display.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopScanner}
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                >
                  Stop camera
                </button>
              </div>
            )}

            {scannerError && (
              <div className="rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/90 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                {scannerError}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Manual code (fallback)
              </p>
              <div className="flex gap-2 items-stretch">
                <div className="relative flex-1 min-w-0">
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        e.preventDefault();
                        submitPunch(manualCode);
                      }
                    }}
                    placeholder="Code or full link"
                    disabled={loading}
                    className="w-full pl-3 pr-11 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    disabled={loading}
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-brand-dark hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white transition disabled:opacity-40"
                  >
                    <PasteIcon />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => submitPunch(manualCode)}
                  disabled={loading}
                  className="shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                Enter or Submit · clipboard icon pastes
              </p>
            </div>
          </div>
        )}

        {flow === 'loading' && (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-brand-dark dark:border-t-white animate-spin" />
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Recording…</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Please keep this page open.</p>
          </div>
        )}

        {flow === 'ok' && (
          <>
            <div className="rounded-2xl border border-green-200/80 dark:border-green-900/50 bg-green-50/80 dark:bg-green-950/25 px-4 py-4 text-center space-y-2">
              <p className="text-green-800 dark:text-green-200 font-semibold">{message}</p>
              {autoRedirectLeft !== null && autoRedirectLeft > 0 && (
                <p className="text-xs text-green-900/80 dark:text-green-300/90">
                  Opening My Time in {autoRedirectLeft}s…
                </p>
              )}
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/time/my')}
                className="w-full inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition"
              >
                Go to My Time
              </button>
              <button
                type="button"
                onClick={cancelAutoRedirect}
                className="w-full inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                Stay Here
              </button>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-dark dark:text-brand-light border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                Back to home
              </Link>
            </div>
          </>
        )}

        {flow === 'err' && (
          <div className="rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/90 dark:bg-red-950/30 px-4 py-4 text-center">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">{message}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => {
                  setFlow('idle');
                  setMessage('');
                }}
                className="text-sm font-semibold text-brand-dark dark:text-brand-light hover:underline"
              >
                Try again
              </button>
              <Link to="/" className="text-sm font-semibold text-brand-dark dark:text-brand-light hover:underline">
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2 2 0 0 1 8.514 5h6.972a2 2 0 0 1 1.687 1.175l.67 1.117c.22.366.61.59 1.037.59H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1.12c.427 0 .817-.224 1.037-.59l.67-1.117Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    </svg>
  );
}

export default TimePunch;
