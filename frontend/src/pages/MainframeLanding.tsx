import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// useTypewriter hook
// ---------------------------------------------------------------------------

function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const delayTimer = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i++;
        if (!cancelled) {
          setDisplayed(text.slice(0, i));
        }
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          if (!cancelled) setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ---------------------------------------------------------------------------
// CopyIcon (inline SVG — two overlapping rectangles)
// ---------------------------------------------------------------------------

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3.5"
        y="0.5"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect
        x="0.5"
        y="3.5"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// MainframeLanding
// ---------------------------------------------------------------------------

export default function MainframeLanding() {
  // --- Video mouse-scrub state ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const seekingRef = useRef(false);

  const SENSITIVITY = 0.8;

  const scheduleSeek = useCallback(() => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;

    const diff = Math.abs(targetTimeRef.current - video.currentTime);
    if (diff < 0.01) return;

    seekingRef.current = true;
    video.currentTime = targetTimeRef.current;
  }, []);

  useEffect(() => {
    const onSeeked = () => {
      seekingRef.current = false;
      scheduleSeek();
    };

    const video = videoRef.current;
    video?.addEventListener('seeked', onSeeked);

    return () => {
      video?.removeEventListener('seeked', onSeeked);
    };
  }, [scheduleSeek]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      if (prevXRef.current === null) {
        prevXRef.current = e.clientX;
        return;
      }

      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + timeOffset)
      );

      scheduleSeek();
    };

    const onMouseLeave = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [scheduleSeek]);

  // --- Typewriter ---
  const { displayed, done } = useTypewriter(
    "Glad you stopped in. Good taste tends to find us. Now, what are we building?"
  );

  // --- Pill buttons fade-in ---
  const [pillsVisible, setPillsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // --- Mobile menu ---
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Copy email ---
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('hello@mainframe.co');
    } catch {
      // clipboard API not available
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* ---------- Background video ---------- */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 z-0 h-full w-full object-cover"
        style={{ objectPosition: '70% center' }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
          type="video/mp4"
        />
      </video>

      {/* ---------- Navbar ---------- */}
      <nav className="fixed top-0 z-10 flex w-full items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span
            className="text-[21px] tracking-tight text-black sm:text-[26px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Mainframe<sup className="text-[10px] sm:text-xs">&reg;</sup>
          </span>
          <span
            className="select-none text-[25px] text-black sm:text-[30px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 text-[23px] text-black md:flex">
          {['Labs', 'Studio', 'Openings', 'Shop'].map((label, i) => (
            <span key={label} className="contents">
              <a href="#" className="transition-opacity hover:opacity-60">
                {label}
              </a>
              {i < 3 && <span className="mx-1 opacity-60">,</span>}
            </span>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="#"
          className="hidden text-[23px] text-black underline underline-offset-2 transition-opacity hover:opacity-60 md:block"
        >
          Get in touch
        </a>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-[5px] md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[2px] w-6 bg-black transition-all duration-300 ${
              menuOpen ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-black transition-all duration-300 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-black transition-all duration-300 ${
              menuOpen ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      {/* ---------- Mobile overlay ---------- */}
      <div
        className={`fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        {['Labs', 'Studio', 'Openings', 'Shop'].map((label) => (
          <a
            key={label}
            href="#"
            className="text-[32px] font-medium text-black"
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </a>
        ))}
        <a
          href="#"
          className="mt-4 text-[32px] font-medium text-black underline"
          onClick={() => setMenuOpen(false)}
        >
          Get in touch
        </a>
      </div>

      {/* ---------- Hero ---------- */}
      <section className="relative z-10 flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          {/* Blurred intro label */}
          <p
            className="pointer-events-none mb-5 select-none sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#000',
              filter: 'blur(4px)',
            }}
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe&apos;s Adaptive Response Interface Agent
          </p>

          {/* Typewriter text */}
          <p
            className="mb-5 min-h-[54px] text-black sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
            }}
          >
            {displayed}
            {!done && (
              <span
                className="ml-[2px] inline-block align-middle"
                style={{
                  width: 2,
                  height: '1.1em',
                  backgroundColor: '#000',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </p>

          {/* Pill buttons */}
          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {['Pitch us an idea', 'Come work here', 'Send a brief hello', 'See how we operate'].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="mb-[0.4em] mx-[0.2em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]"
                >
                  {label}
                </a>
              )
            )}

            {/* Outline pill with copy icon */}
            <button
              onClick={copyEmail}
              className="mb-[0.4em] mx-[0.2em] inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">
                  hello@mainframe.co
                </span>
              </span>
              <CopyIcon />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
