"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CalendarCheck, Play, ArrowDown } from "lucide-react";
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
  monthly,
  collLabel,
}: {
  vehicle: Vehicle;
  monthly: number;
  collLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;

  const chips = [
    fuelLabels[vehicle.fuelType],
    transmissionLabels[vehicle.transmission],
    drivetrainLabels[vehicle.drivetrain],
  ];

  const stats = [
    { value: `${vehicle.power}`, unit: "HP", label: "Мощност" },
    vehicle.acceleration ? { value: `${vehicle.acceleration}`, unit: "сек", label: "0–100 км/ч" } : null,
    vehicle.topSpeed ? { value: `${vehicle.topSpeed}`, unit: "км/ч", label: "Макс. скорост" } : null,
  ].filter(Boolean).slice(0, 2) as Array<{ value: string; unit: string; label: string }>;

  // Subtle scroll parallax on the image.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.16]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // Gentle mouse-follow depth.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 90, damping: 22, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 90, damping: 22, mass: 0.6 });
  const imgMX = useTransform(smx, [-1, 1], [12, -12]);
  const imgMY = useTransform(smy, [-1, 1], [8, -8]);
  const statMX = useTransform(smx, [-1, 1], [-16, 16]);

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }

  return (
    <section className="relative bg-base px-3 pb-3 pt-24 md:px-6 md:pb-5 md:pt-28">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        className="vd-dark vd-hero-card relative mx-auto w-full max-w-[105rem] overflow-hidden rounded-[1.6rem] md:rounded-[2rem]"
      >
        {/* Car image — first thing seen, with parallax + mouse depth */}
        <motion.div style={{ scale: imgScale, y: imgY }} className="absolute inset-0 will-change-transform">
          <motion.div style={{ x: imgMX, y: imgMY }} className="absolute inset-[-3%] will-change-transform">
            <Image
              src={vehicle.images[0]}
              alt={fullLabel}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_46%]"
            />
          </motion.div>
        </motion.div>

        {/* Legibility / depth overlays */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/15 to-[#0a0c10]/55" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0c10]/80 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative flex min-h-[80svh] flex-col p-5 md:min-h-[82svh] md:p-10 lg:p-12">
          {/* Top row — breadcrumb + CTA */}
          <div className="flex items-start justify-between gap-4">
            <nav aria-label="Навигация" className="flex items-center gap-2 text-xs text-fg-muted">
              <Link href="/" className="transition-colors hover:text-fg">Начало</Link>
              <ChevronRight className="size-3" aria-hidden />
              <Link href="/avtomobili" className="transition-colors hover:text-fg">Автомобили</Link>
              <ChevronRight className="hidden size-3 sm:block" aria-hidden />
              <span className="hidden max-w-[40vw] truncate text-fg sm:block" aria-current="page">{fullLabel}</span>
            </nav>
            <Magnetic strength={0.35}>
              <a href="#inquiry" className="vd-pill inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-5 pr-2 text-sm font-semibold">
                Запазете оглед
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--color-base)]/15">
                  <CalendarCheck className="size-4" aria-hidden />
                </span>
              </a>
            </Magnetic>
          </div>

          {/* Floating stats (desktop) */}
          {stats.length > 0 && (
            <motion.div style={{ x: statMX }} className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-7 md:right-10 lg:flex xl:right-12">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 + i * 0.12 }}
                  className="text-right"
                >
                  <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-titanium-num xl:text-5xl">
                    {s.value}<span className="ml-1.5 text-lg font-bold text-fg-muted">{s.unit}</span>
                  </p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-fg-subtle">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Explore vertical */}
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rotate-180 text-[10px] uppercase tracking-[0.32em] text-fg-subtle [writing-mode:vertical-rl] lg:block">
            Разгледай
          </span>

          {/* Headline block — bottom */}
          <div className="mt-auto max-w-3xl">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex items-center gap-3"
            >
              <span className="h-px w-9 bg-accent" />
              <span className="vd-eyebrow text-fg-muted">
                {vehicle.brand}{collLabel ? ` · ${collLabel}` : ""}
              </span>
            </motion.div>

            <h1 className="mt-4 font-display font-extrabold uppercase leading-[0.9] tracking-[-0.03em] text-fg">
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="block text-[clamp(2.2rem,6vw,5rem)]"
              >
                {vehicle.model}
              </motion.span>
              {vehicle.variant && (
                <span className="mt-1 block text-[clamp(1.1rem,2.6vw,1.9rem)] font-bold tracking-tight text-fg-muted">
                  {vehicle.variant}
                </span>
              )}
            </h1>

            {/* chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c} className="rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium text-fg-muted backdrop-blur-md">
                  {c}
                </span>
              ))}
              <span className="rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-medium tabular-nums text-fg-muted backdrop-blur-md">
                {formatNumber(vehicle.mileage)} км
              </span>
            </div>

            {/* price + actions */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div>
                <p className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-extrabold leading-none tracking-tight text-fg">
                  {displayPrice(vehicle.price)}
                </p>
                {monthly > 0 && (
                  <a href="#financing" className="mt-1.5 inline-block text-xs text-fg-muted transition-colors hover:text-fg">
                    от {formatPriceEUR(monthly)} / мес.
                  </a>
                )}
              </div>
              {vehicle.engineSound && (
                <a
                  href="#zvuk"
                  className="group inline-flex items-center gap-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md transition-colors group-hover:border-accent group-hover:text-accent">
                    <Play className="size-4 translate-x-0.5 fill-current" aria-hidden />
                  </span>
                  Чуйте двигателя
                </a>
              )}
            </div>
          </div>

          {/* Scroll cue */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-fg-subtle md:flex">
            <ArrowDown className="size-4 vd-float" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
