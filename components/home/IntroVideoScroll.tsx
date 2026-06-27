"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { CinematicGrade } from "@/components/fx/CinematicGrade";

/**
 * Scroll-scrubbed cinematic intro — "entering the dealership".
 *
 * Apple-style technique: the clip is pre-exploded into sharpened frames
 * (public/intro/frames[-m]) and the right frame is painted to a <canvas> per
 * scroll position. No <video>, no seeking → buttery on desktop AND mobile, with
 * no buffering stalls.
 *
 * Progress is computed directly from the section's position (deterministic and
 * linear — framer's useScroll mis-maps a section with a sticky child). Layers:
 * an "AutoHaus" wordmark over a darkened left that flies past in 3D as you enter
 * the space; a HUD (brackets / reticle / data) that locks on as the car arrives;
 * then a dissolve into the homepage hero.
 */

const FRAME_COUNT = 119;
const SCRUB_VH = 340;
// Bump when the intro clip is re-generated: /intro/* is served immutable for a
// year with stable filenames, so a version token is what actually busts returning
// visitors' caches and lets the new frames/poster load.
const ASSET_VERSION = 2;
const pad = (n: number) => String(n).padStart(3, "0");

export function IntroVideoScroll() {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnP = useRef(0); // smoothed progress actually painted
  const lastIdx = useRef(-1);
  // Only run the per-frame work while the pinned section is on screen — once you
  // scroll past, the loop idles instead of churning layout reads every frame.
  const activeRef = useRef(true);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(0);

  // Deterministic 0→1 progress across the pinned section.
  const progress = useMotionValue(0);

  // ---- overlay choreography (all derived from `progress`) ----
  const introOpacity = useTransform(progress, [0, 0.16, 0.3], [1, 1, 0]);
  const introZ = useTransform(progress, [0, 0.32], [0, 640]);
  const introScale = useTransform(progress, [0, 0.32], [1, 1.16]);
  const introBlur = useTransform(progress, [0.14, 0.3], [0, 7]);
  const introFilter = useTransform(introBlur, (b) => `blur(${b}px)`);
  const leftScrim = useTransform(progress, [0, 0.3], [1, 0]);
  const hudOpacity = useTransform(progress, [0.58, 0.72, 0.9, 1], [0, 1, 1, 0]);
  const hudIn = useTransform(progress, [0.58, 0.74], [1, 0]);
  const cover = useTransform(progress, [0.88, 1], [0, 1]);
  const hint = useTransform(progress, [0, 0.06], [1, 0]);

  useEffect(() => {
    // Device capabilities are only known on the client, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(
      !window.matchMedia("(min-width: 1024px)").matches ||
        !window.matchMedia("(pointer: fine)").matches,
    );
    setMounted(true);
  }, []);

  // Preload the frame sequence (lighter set on mobile).
  useEffect(() => {
    if (!mounted || reduce) return;
    const dir = isMobile ? "frames-m" : "frames";
    const imgs: HTMLImageElement[] = [];
    let count = 0;
    let cancelled = false;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/intro/${dir}/f${pad(i)}.webp?v=${ASSET_VERSION}`;
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
      };
      // Pre-decode each frame so the first paint never hitches (smooth scrub).
      img.decode().then(done).catch(done);
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [mounted, isMobile, reduce]);

  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const tw = Math.round(cw * dpr);
    const th = Math.round(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  };

  useAnimationFrame(() => {
    if (reduce || !activeRef.current) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = rect.height - window.innerHeight;
    const p = dist > 0 ? Math.min(Math.max(-rect.top / dist, 0), 1) : 0;
    progress.set(p);

    // hide the nav while the intro owns the viewport
    const html = document.documentElement;
    if (p > 0.001 && p < 0.92) html.setAttribute("data-intro-active", "1");
    else html.removeAttribute("data-intro-active");

    // ease the painted frame toward p for an extra-smooth scrub
    drawnP.current += (p - drawnP.current) * 0.2;
    if (Math.abs(p - drawnP.current) < 0.0005) drawnP.current = p;
    let idx = Math.round(drawnP.current * (FRAME_COUNT - 1));
    if (loaded < FRAME_COUNT) idx = Math.min(idx, Math.max(loaded - 1, 0));
    if (idx !== lastIdx.current) {
      draw(idx);
      lastIdx.current = idx;
    }
  });

  // Pause the scrub loop's work when the pinned section isn't on screen.
  useEffect(() => {
    if (!mounted || reduce) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (!entry.isIntersecting)
          document.documentElement.removeAttribute("data-intro-active");
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, reduce]);

  useEffect(() => {
    const onResize = () => {
      lastIdx.current = -1;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (loaded > 0) lastIdx.current = -1;
  }, [loaded]);
  useEffect(() => () => document.documentElement.removeAttribute("data-intro-active"), []);

  // Reduced motion → static cinematic still, no pin/scrub.
  if (reduce) {
    return (
      <section className="relative h-[100svh] w-full overflow-hidden bg-base">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/intro/intro-poster.jpg?v=${ASSET_VERSION}`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.45) 30%, transparent 62%)",
          }}
        />
        <div className="absolute inset-0 flex max-w-2xl flex-col justify-center pl-6 md:pl-16">
          <p className="eyebrow text-accent">Пловдив · Премиум автомобили</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="AutoHaus" className="mt-4 w-[clamp(240px,60vw,460px)] select-none" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-base to-transparent" />
      </section>
    );
  }

  const ready = loaded >= FRAME_COUNT;

  return (
    <section
      ref={wrapperRef}
      // Shorter scrub distance on phones — tighter pacing under the thumb.
      style={{ height: `${isMobile ? 230 : SCRUB_VH}vh` }}
      className="relative bg-base"
      aria-label="Въведение"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/intro/intro-poster.jpg?v=${ASSET_VERSION}`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

        {/* cinematic colour grade */}
        <CinematicGrade />

        {/* darkened left for word contrast */}
        <motion.div
          aria-hidden
          style={{
            opacity: leftScrim,
            background:
              "linear-gradient(90deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 28%, transparent 60%)",
          }}
          className="pointer-events-none absolute inset-0"
        />

        {/* AutoHaus wordmark — flies past in 3D as you enter */}
        <div aria-hidden className="pointer-events-none absolute inset-0 [perspective:1200px]">
          <motion.div
            style={{
              opacity: introOpacity,
              z: introZ,
              scale: introScale,
              filter: introFilter,
            }}
            className="absolute inset-0 mx-auto flex h-full w-full max-w-wide flex-col justify-center px-6 md:px-16 xl:px-24"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="eyebrow text-accent"
            >
              Пловдив · Премиум автомобили
            </motion.p>
            <motion.img
              src="/brand/logo.svg"
              alt="AutoHaus"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              className="mt-4 w-[clamp(280px,48vw,660px)] max-w-full select-none"
            />
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
              className="mt-5 max-w-sm text-white/75 md:text-lg"
            >
              Влезте в нашия свят.
            </motion.p>
          </motion.div>
        </div>

        {/* HUD around the car */}
        <motion.div style={{ opacity: hudOpacity }} className="pointer-events-none absolute inset-0">
          <Hud progress={hudIn} />
        </motion.div>

        {/* dissolve → hero */}
        <motion.div
          aria-hidden
          style={{ opacity: cover }}
          className="pointer-events-none absolute inset-0 bg-base"
        />

        {/* loading shimmer */}
        {!ready && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <div className="h-px w-40 overflow-hidden bg-white/15">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round((loaded / FRAME_COUNT) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* scroll hint */}
        {ready && (
          <motion.div
            style={{ opacity: hint }}
            className="pointer-events-none absolute inset-x-0 bottom-9 z-10 flex flex-col items-center gap-3 text-white/70"
          >
            <span className="eyebrow">Скролирайте, за да влезете</span>
            <motion.span
              animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-9 w-px origin-top bg-white/50"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

/**
 * Cinematic HUD overlay — corner brackets frame the viewport, a thin reticle and
 * scan line lock onto the car, and a small data block reads out. `progress`
 * runs 1→0 as it engages.
 */
function Hud({ progress }: { progress: MotionValue<number> }) {
  const reveal = useTransform(progress, [1, 0], [0, 1]);
  const bracketScale = useTransform(progress, [1, 0], [0.7, 1]);
  const lineScale = useTransform(progress, [1, 0], [0, 1]);
  const reticleScale = useTransform(progress, [1, 0], [0.4, 1]);
  const dataY = useTransform(progress, [1, 0], [22, 0]);

  const corners = [
    "left-6 top-24 border-l-2 border-t-2 md:left-12 md:top-28",
    "right-6 top-24 border-r-2 border-t-2 md:right-12 md:top-28",
    "left-6 bottom-28 border-l-2 border-b-2 md:left-12 md:bottom-32",
    "right-6 bottom-28 border-r-2 border-b-2 md:right-12 md:bottom-32",
  ];

  return (
    <div className="absolute inset-0">
      {corners.map((pos, i) => (
        <motion.div
          key={i}
          style={{ opacity: reveal, scale: bracketScale }}
          className={`absolute size-10 border-accent/80 md:size-14 ${pos}`}
        />
      ))}

      <motion.div
        style={{ scaleX: lineScale, opacity: reveal }}
        className="absolute left-0 top-1/2 h-px w-full origin-center bg-gradient-to-r from-transparent via-accent/70 to-transparent"
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{ scale: reticleScale, opacity: reveal }}
          className="relative flex size-28 items-center justify-center md:size-40"
        >
          <span className="absolute inset-0 rounded-full border border-white/25" />
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-accent" />
          <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-accent" />
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-accent" />
          <span className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-accent" />
        </motion.div>
      </div>

      <motion.div
        style={{ opacity: reveal, y: dataY }}
        className="absolute inset-x-0 bottom-16 flex flex-col items-center text-center md:bottom-20"
      >
        <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">
          AutoHaus · 2026
        </p>
        <p className="mt-2 font-display text-2xl font-extrabold text-white md:text-3xl">
          Колекцията ви очаква
        </p>
        <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span>Премиум</span>
          <span className="h-3 w-px bg-white/30" />
          <span>Проверени</span>
          <span className="h-3 w-px bg-white/30" />
          <span>Пловдив</span>
        </div>
      </motion.div>
    </div>
  );
}
