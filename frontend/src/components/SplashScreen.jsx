import { useEffect, useRef } from 'react';

/* ════════════════════════════════════════════════════════════════
   FIRST-LOAD SPLASH SCREEN
   Plays once per browser session before the homepage appears:

     1. Six colored hexagon pieces fly in from different directions
        with fading particle trails, overshoot, then bounce-settle
        into place (the EventSphere brand shape).
     2. The assembled hexagon begins spinning continuously — it
        never stops for the rest of the sequence.
     3. A premium "Welcome to / Your Next Great Event" message
        fades in below the hexagon inside a subtle glass card.
     4. Confetti bursts outward through the (still-spinning)
        hexagon.
     5. The whole splash fades out, revealing the real homepage
        underneath.

   Respects prefers-reduced-motion (skips straight to a static
   logo + message, no motion) and offers a small "Skip" link for
   anyone who wants to bypass it immediately.
════════════════════════════════════════════════════════════════ */

const HEX_PIECES = [
  { id: 'p1', color: '#00F2FE', path: 'M110,110 L110,50 L161.96,80 Z',   start: { x: -180, y: -140 }, rot: -110 },
  { id: 'p2', color: '#1FCDED', path: 'M110,110 L161.96,80 L161.96,140 Z', start: { x: 180, y: -140 },  rot: 110 },
  { id: 'p3', color: '#5A9EE8', path: 'M110,110 L161.96,140 L110,170 Z',  start: { x: 200, y: 60 },    rot: 110 },
  { id: 'p4', color: '#7B7FE0', path: 'M110,110 L110,170 L58.04,140 Z',   start: { x: 0, y: 210 },     rot: -110 },
  { id: 'p5', color: '#9B51E0', path: 'M110,110 L58.04,140 L58.04,80 Z',  start: { x: -200, y: 60 },   rot: 110 },
  { id: 'p6', color: '#C24FD0', path: 'M110,110 L58.04,80 L110,50 Z',     start: { x: -35, y: -210 },  rot: -110 },
];

const OVERSHOOT = [
  'translate(10px,8px) rotate(8deg) scale(1.1)',
  'translate(-10px,8px) rotate(-8deg) scale(1.1)',
  'translate(-12px,-3px) rotate(-8deg) scale(1.1)',
  'translate(0px,-12px) rotate(8deg) scale(1.1)',
  'translate(12px,-3px) rotate(-8deg) scale(1.1)',
  'translate(2px,12px) rotate(8deg) scale(1.1)',
];

const CONFETTI_COLORS = ['#00F2FE', '#9B51E0', '#05FF9B', '#FFB300', '#FF4081'];

export default function SplashScreen({ onDone }) {
  const stageRef = useRef(null);
  const hexSpinGroupRef = useRef(null);
  const trailLayerRef = useRef(null);
  const confettiLayerRef = useRef(null);
  const welcomeMsgRef = useRef(null);
  const pieceRefs = useRef({});
  const timersRef = useRef([]);

  const T = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const finish = () => {
    timersRef.current.forEach(clearTimeout);
    onDone();
  };

  const hasRunRef = useRef(false);

  console.log('[SPLASH DEBUG] SplashScreen component function called/rendered');

  useEffect(() => {
    console.log('[SPLASH DEBUG] useEffect fired. hasRunRef.current =', hasRunRef.current);

    // React.StrictMode (enabled in main.jsx) deliberately mounts every
    // component twice in a row — mount, unmount, mount again — specifically
    // to catch effects that aren't safely re-runnable. Without this guard,
    // that double-mount could schedule two overlapping sets of timers and
    // cleanup calls, which was the actual cause of the splash appearing to
    // skip straight to the homepage instead of playing the animation.
    if (hasRunRef.current) {
      console.log('[SPLASH DEBUG] Skipping - already ran once (StrictMode double-invoke)');
      return;
    }
    hasRunRef.current = true;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    console.log('[SPLASH DEBUG] reduceMotion =', reduceMotion);

    // Respect reduced-motion preference: skip straight to a static
    // logo + message for ~1.4s, no spinning/flying/confetti at all.
    if (reduceMotion) {
      if (welcomeMsgRef.current) {
        welcomeMsgRef.current.style.transition = 'opacity 0.4s ease';
        welcomeMsgRef.current.style.opacity = '1';
        welcomeMsgRef.current.style.transform = 'none';
      }
      HEX_PIECES.forEach(p => {
        const el = pieceRefs.current[p.id];
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      T(finish, 1400);
      return () => timersRef.current.forEach(clearTimeout);
    }

    // PHASE 1 — hexagon pieces fly in with fading particle trails,
    // overshoot past their final position, then bounce-settle.
    HEX_PIECES.forEach((piece, i) => {
      const el = pieceRefs.current[piece.id];
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${piece.start.x}px,${piece.start.y}px) rotate(${piece.rot}deg) scale(0.3)`;
      el.style.opacity = '0';
    });

    HEX_PIECES.forEach((piece, i) => {
      T(() => {
        const el = pieceRefs.current[piece.id];
        if (!el) return;

        // Fading dot trail behind this piece's flight path
        const trailLayer = trailLayerRef.current;
        if (trailLayer) {
          for (let d = 0; d < 5; d++) {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const frac = d / 5;
            const ex = piece.start.x * (1 - frac) * 0.4;
            const ey = piece.start.y * (1 - frac) * 0.4;
            dot.setAttribute('cx', 110 + ex);
            dot.setAttribute('cy', 110 + ey);
            dot.setAttribute('r', 3 - d * 0.4);
            dot.setAttribute('fill', piece.color);
            dot.style.opacity = String(0.5 - d * 0.08);
            dot.style.transition = 'opacity 0.4s ease';
            trailLayer.appendChild(dot);
            T(() => {
              dot.style.opacity = '0';
              T(() => dot.remove(), 400);
            }, 50 + d * 20);
          }
        }

        el.style.transition = 'transform 0.55s cubic-bezier(0.2,0.9,0.3,1.4), opacity 0.3s ease, filter 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = OVERSHOOT[i];
        el.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.5))';
        T(() => {
          el.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease';
          el.style.transform = 'translate(0,0) rotate(0deg) scale(1)';
          el.style.filter = 'none';
        }, 300);
      }, 80 + i * 100);
    });

    const hexDone = 80 + HEX_PIECES.length * 100 + 350;

    // PHASE 2 — continuous spin begins and never stops for the rest
    // of the sequence (runs right through the message and confetti).
    T(() => {
      if (hexSpinGroupRef.current) {
        hexSpinGroupRef.current.style.animation = 'splash-spin 6s linear infinite';
      }
    }, hexDone);

    // PHASE 3 — premium welcome message fades in first.
    const msgStart = hexDone + 350;
    T(() => {
      const el = welcomeMsgRef.current;
      if (!el) return;
      el.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    }, msgStart);

    // PHASE 4 — confetti bursts outward through the (still-spinning)
    // hexagon, shortly after the message has had a moment to register.
    const confettiStart = msgStart + 650;
    T(() => {
      const layer = confettiLayerRef.current;
      if (!layer) return;
      const pieces = [];
      for (let i = 0; i < 55; i++) {
        const piece = document.createElement('div');
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const dist = 95 + Math.random() * 95;
        const size = 4 + (dist / 190) * 7;
        piece.style.position = 'absolute';
        piece.style.left = '50%';
        piece.style.top = '50%';
        piece.style.width = `${size}px`;
        piece.style.height = `${size}px`;
        piece.style.background = color;
        piece.style.borderRadius = i % 2 ? '50%' : '1px';
        piece.style.opacity = '1';
        piece.style.transform = 'translate(0,0) rotate(0deg)';
        piece.style.transition = 'none'; // no transition yet — set AFTER the reflow below
        layer.appendChild(piece);
        pieces.push({ el: piece, angle: (i / 55) * Math.PI * 2, dist });
      }
      // Force the browser to paint/register every piece at its starting
      // position (center, opacity 1, no transform) BEFORE we turn the
      // transition on and change the target values. Without this explicit
      // reflow, the browser can collapse "create + immediately change" into
      // a single frame with no visible animation — which is exactly what
      // was happening: confetti pieces appeared and vanished instantly.
      void layer.offsetHeight;
      pieces.forEach(({ el, angle, dist }) => {
        el.style.transition = 'transform 1.1s cubic-bezier(0.2,0.8,0.3,1), opacity 1.1s ease';
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 30}px) rotate(${Math.random() * 360}deg)`;
        el.style.opacity = '0';
      });
      // Clean up the DOM nodes after their animation finishes so they
      // don't linger invisibly in the tree.
      T(() => pieces.forEach(({ el }) => el.remove()), 1300);
    }, confettiStart);

    // PHASE 5 — fade the whole splash out, revealing the homepage.
    T(() => {
      if (stageRef.current) {
        stageRef.current.style.transition = 'opacity 0.6s ease, visibility 0.6s ease';
        stageRef.current.style.opacity = '0';
        stageRef.current.style.visibility = 'hidden';
      }
      T(finish, 600);
    }, confettiStart + 1500);

    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={stageRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#060810',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Ambient breathing glow behind everything, for depth */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: 560, height: 560,
        transform: 'translate(-50%,-50%)',
        background: 'radial-gradient(circle, rgba(0,242,254,0.09) 0%, rgba(155,81,224,0.06) 40%, transparent 70%)',
        borderRadius: '50%', animation: 'splash-breathe 3.5s ease-in-out infinite', pointerEvents: 'none',
      }} />
      {/* Faint dot-grain texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      {/* Skip link — bypass the animation immediately if desired */}
      <button
        onClick={finish}
        aria-label="Skip intro animation"
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif",
          padding: '6px 14px', borderRadius: 50, cursor: 'pointer',
        }}
      >
        Skip
      </button>

      {/* Logo + brand name + tagline — fixed, never animated/overlapped */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative', zIndex: 5 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 36px rgba(0,242,254,0.3)', flexShrink: 0,
        }}>
          <i className="bi bi-calendar-event" style={{ color: '#000', fontSize: 32 }} />
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: 0.5 }}>
          <span style={{ color: '#F8FAFC' }}>Event</span><span style={{ color: '#00F2FE' }}>Sphere</span>
        </div>
        <div style={{ fontSize: 13, color: '#8892A4', letterSpacing: 0.3, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Elite Event Management Platform
        </div>
      </div>

      {/* Hexagon assembly area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 5 }}>
        <div style={{ height: 'min(230px, 40vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
          <svg width="min(220px, 50vw)" height="min(220px, 50vw)" viewBox="0 0 220 220" style={{ overflow: 'visible', position: 'relative' }}>
            <g ref={trailLayerRef} />
            <g ref={hexSpinGroupRef} style={{ transformOrigin: '110px 110px' }}>
              {HEX_PIECES.map(piece => (
                <g key={piece.id} ref={el => (pieceRefs.current[piece.id] = el)} style={{ transformOrigin: '110px 110px' }}>
                  <path d={piece.path} fill={piece.color} />
                </g>
              ))}
            </g>
            <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </svg>
          <div ref={confettiLayerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
        </div>

        {/* Premium welcome message — solid colors only (no gradient-text
            tricks, which can silently render invisible in some browsers
            if background-clip:text isn't supported) */}
        <div
          ref={welcomeMsgRef}
          style={{
            textAlign: 'center', opacity: 0, transform: 'translateY(14px) scale(0.92)',
            position: 'relative', zIndex: 5, marginTop: 6,
            padding: '18px 32px', borderRadius: 16,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 18, height: 1, background: 'linear-gradient(90deg,transparent,#05FF9B)' }} />
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#05FF9B', fontWeight: 700, textTransform: 'uppercase', fontFamily: "'Space Grotesk',sans-serif" }}>
              Welcome to
            </div>
            <div style={{ width: 18, height: 1, background: 'linear-gradient(90deg,#05FF9B,transparent)' }} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: '#F8FAFC' }}>
            Your Next Great Event
          </div>
          <div style={{ fontSize: 12, color: '#6B7686', marginTop: 6, letterSpacing: 0.2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Awaits just ahead
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splash-breathe {
          0%, 100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes splash-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}