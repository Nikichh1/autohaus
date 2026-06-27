"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { CinematicGrade } from "@/components/fx/CinematicGrade";

/**
 * Scene — "Машината". A pinned dark beat: a cinematic car film plays on the RIGHT
 * (scroll-scrubbed via a pre-decoded frame sequence — buttery, like the intro),
 * pulling from a detail out to the full reveal as you scroll. The LEFT is
 * darkened and carries the chapter, headline, details and CTA. No WebGL.
 */

const FRAME_COUNT = 120;
const SCRUB_VH = 260;
const pad = (n: number) => String(n).padStart(3, "0");

const DETAILS: [string, string][] = [
  ["Дизайн", "Силует, роден от скоростта"],
  ["Прецизност", "Изпипана до последния детайл"],
  ["Характер", "Създаден да остави следа"],
];

export function FeatureScene() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnP = useRef(0);
  const lastIdx = useRef(-1);
  // Gates the per-frame draw loop to when the pinned scene is actually on screen.
  const activeRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [near, setNear] = useState(false);

  const progress = useMotionValue(0);
  const copyY = useTransform(progress, [0, 1], reduce ? ["0%", "0%"] : ["7%", "-7%"]);
  // scroll-triggered titanium HUD over the film
  const hudOpacity = useTransform(progress, [0.04, 0.2], [0, 1]);
  const hudScale = useTransform(progress, [0.04, 0.2], [0.86, 1]);
  const scanTop = useTransform(progress, [0.08, 0.96], ["16%", "84%"]);
  const scanOpacity = useTransform(progress, [0.06, 0.16, 0.9, 1], [0, 0.85, 0.85, 0]);
  const scanBarW = useTransform(progress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    // SSR-safe mount pattern: render the same on the server and first client
    // paint, then resolve the real viewport after mount (a lazy initial state
    // would hydrate-mismatch). The synchronous setState here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(!window.matchMedia("(min-width: 1024px)").matches);
    setMounted(true);
  }, []);

  // Defer the heavy frame preload until the section is ~1.5 screens away, so it
  // never competes with the hero/intro on first paint. Frames still arrive before
  // the scrub begins; the draw loop already clamps to whatever has loaded.
  useEffect(() => {
    if (!mounted) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  // Separate, tighter observer: only paint frames while the scene is on screen.
  useEffect(() => {
    if (!mounted) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !near) return;
    const dir = isMobile ? "frames-m" : "frames";
    const imgs: HTMLImageElement[] = [];
    let count = 0;
    let cancelled = false;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/feature/${dir}/f${pad(i)}.webp`;
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
      };
      img.decode().then(done).catch(done);
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [mounted, isMobile, near]);

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
    // lift the graded-dark footage so detail stays visible without losing mood
    ctx.filter = "brightness(1.22) contrast(1.03) saturate(1.06)";
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    ctx.filter = "none";
  };

  useAnimationFrame(() => {
    if (!activeRef.current) return;
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = rect.height - window.innerHeight;
    const p = dist > 0 ? Math.min(Math.max(-rect.top / dist, 0), 1) : 0;
    progress.set(p);

    if (reduce) {
      if (lastIdx.current !== 0) {
        draw(0);
        lastIdx.current = 0;
      }
      return;
    }
    drawnP.current += (p - drawnP.current) * 0.2;
    if (Math.abs(p - drawnP.current) < 0.0005) drawnP.current = p;
    let idx = Math.round(drawnP.current * (FRAME_COUNT - 1));
    if (loaded < FRAME_COUNT) idx = Math.min(idx, Math.max(loaded - 1, 0));
    if (idx !== lastIdx.current) {
      draw(idx);
      lastIdx.current = idx;
    }
  });

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

  const ready = loaded >= FRAME_COUNT;

  return (
    <section
      ref={sectionRef}
      // Tighter scrub distance on phones so the beat doesn't overstay.
      style={{ height: `${isMobile ? 190 : SCRUB_VH}vh` }}
      className="relative bg-base text-fg"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Full-bleed cinematic car film (no hard crop edge — it melts into the
            dark left via the gradient below) */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/feature/poster.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
          <CinematicGrade />
        </div>

        {/* darken LEFT + melt the film's left edge into the base */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgb(12 14 17) 0%, rgb(12 14 17) 24%, rgb(12 14 17 / 0.74) 38%, rgb(12 14 17 / 0.34) 52%, rgb(12 14 17 / 0.08) 64%, transparent 74%)",
          }}
        />
        {/* extra bottom scrim for mobile legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-base via-base/40 to-transparent lg:hidden" />
        {/* top/bottom seams into neighbouring sections */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-base to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-base to-transparent" />

        {/* Scroll-triggered titanium HUD over the film (desktop) */}
        {!reduce && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] hidden lg:block">
            {/* framing brackets on the film side */}
            <motion.div
              style={{ opacity: hudOpacity, scale: hudScale }}
              className="absolute bottom-[15%] left-[52%] right-[5%] top-[17%] origin-center"
            >
              <span className="absolute left-0 top-0 size-10 border-l border-t border-accent/45" />
              <span className="absolute right-0 top-0 size-10 border-r border-t border-accent/45" />
              <span className="absolute bottom-0 left-0 size-10 border-b border-l border-accent/45" />
              <span className="absolute bottom-0 right-0 size-10 border-b border-r border-accent/45" />
            </motion.div>
            {/* scan line sweeping the form */}
            <motion.div
              style={{ top: scanTop, opacity: scanOpacity }}
              className="absolute left-[52%] right-[5%] h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
            />
            {/* telemetry readout */}
            <motion.div style={{ opacity: hudOpacity }} className="absolute right-[5%] top-[9%]">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                <span className="label-fine text-accent">Анализ на формата</span>
              </div>
              <div className="mt-2.5 h-px w-44 overflow-hidden bg-white/12">
                <motion.div style={{ width: scanBarW }} className="h-full bg-accent" />
              </div>
            </motion.div>
          </div>
        )}

        {/* LEFT — copy / details */}
        <motion.div
          style={{ y: copyY }}
          className="relative z-10 mx-auto flex h-full max-w-wide items-center px-4 md:px-8 xl:px-12"
        >
          <div className="max-w-md">
            <FadeIn>
              <ChapterLabel index="03" label="Машината" />
            </FadeIn>
            <Reveal>
              <h2 className="mt-5 font-display text-display-xs font-extrabold leading-[0.98] tracking-tight text-fg md:text-display-sm xl:text-display-md">
                Създадени<br />за движение.
              </h2>
            </Reveal>
            <FadeIn delay={0.12}>
              <p className="mt-6 max-w-sm text-fg/70 md:text-lg">
                Силует, мощност и баланс в перфектна хармония — автомобил, който
                усещате още преди да запалите двигателя.
              </p>
            </FadeIn>
            <FadeIn delay={0.24}>
              <div className="mt-9 space-y-px border-t border-line-strong">
                {DETAILS.map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-4"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-display text-xs tabular-nums text-accent">
                        0{i + 1}
                      </span>
                      <span className="font-display text-base font-semibold text-fg">{k}</span>
                    </span>
                    <span className="text-right text-xs uppercase tracking-wider text-fg-muted">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.38}>
              <div className="mt-9">
                <ButtonLink
                  href="/avtomobili"
                  variant="solid"
                  size="lg"
                  arrow
                >
                  Разгледай колекцията
                </ButtonLink>
              </div>
            </FadeIn>
          </div>
        </motion.div>

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
      </div>
    </section>
  );
}
