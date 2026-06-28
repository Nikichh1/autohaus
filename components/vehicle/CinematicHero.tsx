"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Phone, CalendarCheck } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import type { Vehicle } from "@/types";
import { displayPrice, formatNumber, formatPriceEUR } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";
import { Magnetic } from "@/components/fx/Magnetic";

export function CinematicHero({
  vehicle,
  phone,
  monthly,
  collLabel,
}: {
  vehicle: Vehicle;
  phone: string;
  monthly: number;
  collLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;

  const chips = [
    { text: `${vehicle.year}` },
    { text: `${formatNumber(vehicle.mileage)} км` },
    { text: fuelLabels[vehicle.fuelType] },
    { text: transmissionLabels[vehicle.transmission] },
    { text: drivetrainLabels[vehicle.drivetrain], accent: true },
  ];

  const miniSpecs = [
    { value: `${vehicle.power}`, unit: "к.с.", label: "Мощност" },
    vehicle.acceleration ? { value: `${vehicle.acceleration}`, unit: "сек", label: "0–100 км/ч" } : null,
    vehicle.topSpeed ? { value: `${vehicle.topSpeed}`, unit: "км/ч", label: "Макс. скорост" } : null,
  ].filter(Boolean) as Array<{ value: string; unit: string; label: string }>;

  // Scroll parallax — image zooms/drifts, content recedes + fades as you leave.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.26]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const ghostY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -130]);

  // Mouse-follow depth — layers drift at different magnitudes.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 110, damping: 20, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 110, damping: 20, mass: 0.5 });
  const imgMX = useTransform(smx, [-1, 1], [18, -18]);
  const imgMY = useTransform(smy, [-1, 1], [12, -12]);
  const cardMX = useTransform(smx, [-1, 1], [-34, 34]);
  const cardMY = useTransform(smy, [-1, 1], [-22, 22]);

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative min-h-[100svh] w-full overflow-hidden vd-hero-field"
    >
      {/* Background image — scroll zoom + mouse drift, two nested layers */}
      <motion.div style={{ scale: imgScale, y: imgY }} className="absolute inset-0 will-change-transform">
        <motion.div style={{ x: imgMX, y: imgMY }} className="absolute inset-[-4%] will-change-transform">
          <Image
            src={vehicle.images[0]}
            alt={fullLabel}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_42%]"
          />
        </motion.div>
      </motion.div>

      {/* Cinematic overlays — depth + legibility */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0c10]/85 via-[#0a0c10]/20 to-[#0a0c10]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0a0c10]/80 via-transparent to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(110% 80% at 78% 18%, rgb(var(--va-glow)/0.20), transparent 55%)" }}
      />

      {/* Ghost brand watermark */}
      <motion.span
        aria-hidden
        style={{ y: ghostY }}
        className="text-stroke pointer-events-none absolute -left-2 top-[16%] select-none font-display text-[26vw] font-extrabold leading-none tracking-tight md:top-[12%]"
      >
        {vehicle.brand}
      </motion.span>

      {/* ── Content column ── */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-wide flex-col px-4 pb-12 pt-28 md:px-8 md:pb-16 md:pt-32 xl:px-12">
        {/* Breadcrumb */}
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          aria-label="Навигация"
          className="flex items-center gap-2 text-xs text-fg-muted"
        >
          <Link href="/" className="transition-colors hover:text-fg">Начало</Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link href="/avtomobili" className="transition-colors hover:text-fg">Автомобили</Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="truncate text-accent" aria-current="page">{fullLabel}</span>
        </motion.nav>

        {/* Floating spec cards (desktop) */}
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:right-8 lg:flex xl:right-12">
          {miniSpecs.map((s, i) => (
            <motion.div
              key={s.label}
              style={{ x: cardMX, y: cardMY }}
              initial={reduce ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-44 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">{s.label}</p>
              <p className="mt-2 flex items-baseline gap-1.5 font-display text-3xl font-extrabold leading-none tracking-tight text-titanium-num">
                {s.value}
                <span className="text-xs font-medium text-fg-muted">{s.unit}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Headline + buy row pinned to the bottom */}
        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="mt-auto will-change-transform">
          <div className="flex items-center gap-3.5">
            <span className="h-px w-11" style={{ background: "linear-gradient(90deg,var(--va),transparent)" }} />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.26em] text-accent">
              {vehicle.brand}{collLabel ? ` · ${collLabel} Collection` : ""}
            </span>
          </div>

          <h1 className="mt-4 font-display font-extrabold uppercase leading-[0.86] tracking-[-0.04em] text-fg">
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[clamp(2.8rem,11vw,9rem)]"
            >
              {vehicle.model}
            </motion.span>
            {vehicle.variant && (
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="block text-[clamp(1.4rem,5vw,3.4rem)] font-bold text-fg-muted"
              >
                {vehicle.variant}
              </motion.span>
            )}
          </h1>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 flex flex-wrap items-end justify-between gap-6"
          >
            {/* chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.text}
                  className={
                    c.accent
                      ? "rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-medium tabular-nums text-accent backdrop-blur-md"
                      : "rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium tabular-nums text-fg-muted backdrop-blur-md"
                  }
                >
                  {c.text}
                </span>
              ))}
            </div>

            {/* price + CTA — glass */}
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-4">
              <div className="text-left sm:text-right">
                <p className={vehicle.price > 0 ? "text-accent-num font-display text-3xl font-extrabold leading-none tracking-tight md:text-4xl" : "font-display text-3xl font-extrabold text-fg"}>
                  {displayPrice(vehicle.price)}
                </p>
                {monthly > 0 && (
                  <a href="#financing" className="mt-1 inline-block text-xs text-fg-muted transition-colors hover:text-accent">
                    от {formatPriceEUR(monthly)} / мес.
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Magnetic strength={0.4}>
                  <a
                    href="#inquiry"
                    className="btn-accent inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-6 text-sm font-semibold sm:px-7"
                  >
                    <CalendarCheck className="size-[18px]" aria-hidden />
                    <span className="whitespace-nowrap">Запазете оглед</span>
                  </a>
                </Magnetic>
                <a
                  href={telHref}
                  aria-label={`Обади се на ${phone}`}
                  className="hidden size-14 items-center justify-center rounded-full border border-white/15 text-fg backdrop-blur-md transition-colors hover:border-accent hover:text-accent sm:inline-flex"
                >
                  <Phone className="size-5" aria-hidden />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative — index + scroll cue */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="text-[10px] uppercase tracking-[0.3em] text-fg-subtle">Скрол</span>
        <span className="block h-9 w-px origin-top bg-accent vd-scrollcue" />
      </div>
    </section>
  );
}
