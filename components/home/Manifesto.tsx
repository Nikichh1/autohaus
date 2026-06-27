"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  cubicBezier,
  type MotionValue,
} from "framer-motion";

// Gentle ease-in-out so each word resolves smoothly along the scroll instead of
// snapping in — keeps the cascade soft, never abrupt.
const REVEAL_EASE = cubicBezier(0.45, 0, 0.55, 1);
import { ChapterLabel } from "@/components/ui/ChapterLabel";

const WORDS =
  "Не просто автосалон — дом за машини с характер. Всяка е подбрана, проверена и готова за пътя."
    .split(" ");

/**
 * Scene 01 — Statement. Words resolve from dim graphite to polished titanium as
 * you scroll, on a brushed-metal field with a slow metallic sheen. Bold, large,
 * cinematic — the philosophy stated like an inscription on machined steel.
 */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  // Drive the reveal off the PARAGRAPH itself (not the tall section) so the
  // timing is precise: it begins the moment the line peeks in from the bottom
  // and is fully resolved by the time the paragraph reaches the middle of the
  // screen — i.e. while the whole sentence is still on screen and readable.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "center 0.6"],
  });

  return (
    <section
      className="field-graphite relative overflow-hidden py-[16vh] md:py-[32vh]"
    >
      {/* brushed-titanium texture */}
      <div aria-hidden className="brushed pointer-events-none absolute inset-0 opacity-[0.05]" />
      {/* machined top + bottom hairlines */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* slow metallic sheen sweeping the type */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background:
              "linear-gradient(108deg, transparent 38%, rgba(220,228,236,0.06) 50%, transparent 62%)",
          }}
          initial={{ x: "-35%" }}
          animate={{ x: "35%" }}
          transition={{ duration: 14, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      )}

      {/* ── Cinematic backdrop — fills the field with the brand's machined,
          instrument-panel language so the statement never sits in a void ── */}
      {/* precision grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
          backgroundSize: "84px 84px",
          maskImage: "radial-gradient(82% 78% at 26% 44%, #000 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(82% 78% at 26% 44%, #000 20%, transparent 80%)",
        }}
      />
      {/* titanium glow pools */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 52% at 88% 16%, rgba(201,207,214,0.13), transparent 64%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 45% at 8% 92%, rgba(201,207,214,0.07), transparent 62%)",
        }}
      />
      {/* oversized chapter numeral watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-2%] top-1/2 hidden -translate-y-1/2 select-none font-display text-[32vw] font-extrabold leading-none tracking-tighter text-white/[0.025] lg:block"
      >
        01
      </span>
      {/* machined corner ticks */}
      <div aria-hidden className="pointer-events-none absolute inset-5 hidden md:inset-8 md:block">
        <span className="absolute left-0 top-0 h-7 w-7 border-l border-t border-white/10" />
        <span className="absolute right-0 top-0 h-7 w-7 border-r border-t border-white/10" />
        <span className="absolute bottom-0 left-0 h-7 w-7 border-b border-l border-white/10" />
        <span className="absolute bottom-0 right-0 h-7 w-7 border-b border-r border-white/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8 xl:px-12">
        <ChapterLabel index="01" label="Философията на AutoHaus" className="mb-12" />
        <p
          ref={ref}
          className="flex flex-wrap font-display text-[2.1rem] font-extrabold leading-[1.16] tracking-tight sm:text-display-xs md:text-display-sm md:leading-[1.07] lg:text-display-md"
        >
          {WORDS.map((w, i) => (
            <Word
              key={i}
              word={w}
              index={i}
              total={WORDS.length}
              progress={scrollYProgress}
              reduce={!!reduce}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({
  word,
  index,
  total,
  progress,
  reduce,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  // Spread the cascade across most of the scroll with a wide per-word overlap so
  // it reads as a soft, gentle wave (not a staccato snap), finishing while the
  // paragraph is near screen-centre — every word revealed AND still on screen.
  const SPAN = 0.9;
  const start = (index / total) * SPAN;
  const end = ((index + 2.6) / total) * SPAN;
  const opacity = useTransform(progress, [start, end], [0.18, 1], { ease: REVEAL_EASE });
  const blurN = useTransform(progress, [start, end], reduce ? [0, 0] : [10, 0], { ease: REVEAL_EASE });
  const filter = useTransform(blurN, (b) => `blur(${b}px)`);
  const y = useTransform(progress, [start, end], reduce ? [0, 0] : [14, 0], { ease: REVEAL_EASE });

  return (
    // Outer span owns layout (word gap + the rise/opacity) — never clipped.
    <motion.span style={{ opacity, y }} className="mr-[0.26em] inline-block">
      {/* Inner span owns the gradient fill + blur. Padding gives the composited
          filter layer room so descenders and the blur halo are never clipped;
          the matching negative margin keeps the outer box identical, so nothing
          on the page shifts position. */}
      <motion.span
        style={{ filter }}
        className="text-titanium inline-block px-[0.14em] py-[0.3em] -mx-[0.14em] -my-[0.3em] will-change-[filter]"
      >
        {word}
      </motion.span>
    </motion.span>
  );
}
