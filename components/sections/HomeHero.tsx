"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { StatCounter } from "@/components/motion/StatCounter";
import { ease } from "@/lib/motion";

const credentials = [
  { to: 20, suffix: "+", label: "Години на пазара" },
  { to: 4800, suffix: "+", label: "Доставени автомобила" },
  { to: 35, suffix: "", label: "Представени марки" },
];

export type HeroContent = {
  eyebrow: string;
  headline: string;
  subcopy: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const HERO_DEFAULTS: HeroContent = {
  eyebrow: "Пловдив · Дом за премиум автомобили",
  headline: "Колата, която\nви заслужава.",
  subcopy:
    "Не просто автомобил, а начало. Всяка кола в нашата колекция е подбрана и проверена — за да я карате с увереност, не с надежда.",
  ctaPrimary: "Разгледай колекцията",
  ctaSecondary: "Запазете оглед",
};

export function HomeHero({ content }: { content?: Partial<HeroContent> } = {}) {
  const c = { ...HERO_DEFAULTS, ...content };
  const headlineLines = c.headline.split("\n").filter(Boolean);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.06, 1.16]);
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "9%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-16%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[660px] w-full overflow-hidden bg-base"
    >
      {/* Parallax cinematic vehicle layer */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: ease.entrance }}
          className="absolute inset-0"
        >
          <Image
            src="/photos/autohaus_lights.jpg"
            alt="Шоурумът на AutoHaus по залез — премиум автосалон в Пловдив"
            fill
            priority
            quality={92}
            sizes="100vw"
            className="object-cover object-[50%_42%]"
          />
        </motion.div>
      </motion.div>

      {/* ── Cinematic staging ── */}
      {/* Cool depth wash — pulls the frame toward the graphite palette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 110% at 72% 32%, transparent 46%, rgba(8,9,12,0.4) 100%)",
        }}
      />
      {/* Soft top scrim for the transparent nav */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-base/75 via-base/20 to-transparent" />
      {/* Bottom scrim anchoring the headline */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-base) 1%, rgba(8,9,12,0.82) 20%, rgba(8,9,12,0.34) 42%, transparent 62%)",
        }}
      />
      {/* Left vignette to seat the type */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(8,9,12,0.72) 0%, rgba(8,9,12,0.3) 28%, transparent 52%)",
        }}
      />

      {/* Slow specular light-sweep — studio light passing over metal, not a glow */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background:
              "linear-gradient(108deg, transparent 34%, rgba(220,228,236,0.07) 48%, rgba(220,228,236,0.02) 55%, transparent 66%)",
          }}
          initial={{ x: "-22%", opacity: 0 }}
          animate={{ x: ["-22%", "26%"], opacity: [0, 1, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
        />
      )}

      {/* Precision corner framing — a quiet "instrument" cue */}
      <div aria-hidden className="pointer-events-none absolute inset-4 hidden md:inset-6 md:block">
        <span className="absolute left-0 top-0 h-8 w-8 border-l border-t border-white/15" />
        <span className="absolute right-0 top-0 h-8 w-8 border-r border-t border-white/15" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/15" />
        <span className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-white/15" />
      </div>

      {/* ── Content ── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex h-full flex-col justify-end pb-10 md:pb-14"
      >
        <div className="mx-auto w-full max-w-wide px-4 md:px-8 xl:px-12">
          <Reveal>
            <p className="flex items-center gap-3 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <span className="label-fine">{c.eyebrow}</span>
            </p>
          </Reveal>

          <h1 className="mt-5 max-w-[16ch] text-balance font-display text-display-sm font-extrabold leading-[0.9] tracking-tight text-fg md:text-display-md xl:text-display-lg [@media(min-height:900px)]:xl:text-display-xl">
            {headlineLines.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.09em]">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: "112%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1, ease: ease.entrance, delay: 0.2 + i * 0.13 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <Reveal delay={0.28}>
            <p className="mt-5 max-w-md text-base leading-relaxed text-fg/80 md:mt-6 md:text-lg">
              {c.subcopy}
            </p>
          </Reveal>

          <Reveal delay={0.42}>
            <div className="mt-7 flex flex-wrap items-center gap-4 md:mt-8">
              <ButtonLink href="/avtomobili" variant="solid" size="lg" arrow>
                {c.ctaPrimary}
              </ButtonLink>
              <ButtonLink href="/kontakti" variant="ghost" size="lg">
                {c.ctaSecondary}
              </ButtonLink>
            </div>
          </Reveal>

          {/* Compact proof line — phones (the full strip shows from sm:) */}
          <Reveal delay={0.5}>
            <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line-strong pt-4 text-xs text-fg-muted sm:hidden">
              <span className="font-display font-extrabold text-fg">20+</span> години
              <span className="text-fg-subtle">·</span>
              <span className="font-display font-extrabold text-fg">4800+</span> автомобила
              <span className="text-fg-subtle">·</span>
              <span className="font-display font-extrabold text-fg">35</span> марки
            </p>
          </Reveal>

          {/* Credential strip — branded proof */}
          <Reveal delay={0.56}>
            <div className="mt-7 hidden flex-wrap items-center gap-x-12 gap-y-5 border-t border-line-strong pt-5 sm:flex md:mt-9">
              {credentials.map((c) => (
                <div key={c.label} className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-extrabold leading-none text-fg md:text-3xl">
                    <StatCounter to={c.to} suffix={c.suffix} duration={2.2} />
                  </span>
                  <span className="max-w-[9rem] text-xs uppercase leading-tight tracking-wider text-fg-muted">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 md:left-auto md:right-10 md:translate-x-0 lg:hidden"
      >
        <div className="flex flex-col items-center gap-3 text-fg/60">
          <span className="label-fine hidden md:[writing-mode:vertical-rl] md:block">Прелистете</span>
          <motion.div
            animate={reduce ? { scaleY: 1 } : { scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-px origin-top bg-fg/50"
          />
        </div>
      </motion.div>
    </section>
  );
}
