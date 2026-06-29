"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/FadeIn";
import { contactInfo } from "@/lib/nav";
import { ease } from "@/lib/motion";

const HEADLINE = ["Вашата следваща", "глава."];

const channels = [
  {
    Icon: Phone,
    label: "Обадете се",
    value: contactInfo.phone,
    sub: contactInfo.hours[0].time,
    href: `tel:${contactInfo.phone.replace(/\s/g, "")}`,
  },
  {
    Icon: Mail,
    label: "Пишете ни",
    value: contactInfo.email,
    sub: "Отговаряме в рамките на деня",
    href: `mailto:${contactInfo.email}`,
  },
  {
    Icon: MapPin,
    label: "Посетете ни",
    value: `${contactInfo.address.city}`,
    sub: contactInfo.address.street,
    href: "/kontakti",
  },
];

const credentials = [
  ["20+", "години на пазара"],
  ["4800+", "доставени автомобила"],
  ["35", "представени марки"],
];

/**
 * Finale — the cinematic close. Bookends the film: the AutoHaus showroom returns
 * at golden hour, faded into the graphite field, beneath a luxury light-signature
 * bar, an emotional headline, the full contact panel and a closing credential
 * signature. Built to leave a lasting, meaningful impression.
 */
export function FinaleScene() {
  const reduce = useReducedMotion();
  // Observe the (non-transformed) heading itself — observing the clip-revealed
  // inner spans directly is unreliable (their 118% offset box never registers as
  // in-view at the very bottom of the page, so the headline stayed hidden).
  const headRef = useRef<HTMLHeadingElement>(null);
  const headInView = useInView(headRef, { once: true, amount: 0.2 });

  return (
    <section className="field-graphite relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-[15vh]">
      {/* ── Cinematic backdrop — the showroom at golden hour, returning ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 2.2, ease: ease.entrance }}
        >
          <Image
            src="/photos/autohaus_lights.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_45%] opacity-[0.18]"
          />
        </motion.div>
        {/* blend the photo into the graphite field, top and bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-base) 0%, rgba(8,9,12,0.6) 34%, rgba(8,9,12,0.74) 64%, var(--color-base) 100%)",
          }}
        />
      </div>

      {/* drifting cinematic glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(56% 50% at 50% 34%, rgba(201,207,214,0.15), transparent 62%)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* precision grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
          backgroundSize: "82px 82px",
          maskImage: "radial-gradient(72% 66% at 50% 44%, #000 26%, transparent 76%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-wide px-4 md:px-8 xl:px-12">
        <div className="flex flex-col items-center text-center">
          <FadeIn>
            <p className="flex items-center justify-center gap-3 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <span className="label-fine">Вашата покана</span>
              <span className="h-px w-8 bg-accent/50" />
            </p>
          </FadeIn>

          {/* Luxury light-signature bar — a DRL illuminating across the frame */}
          <div className="relative mt-10 h-px w-full max-w-2xl md:mt-12">
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,207,214,0.55) 35%, rgba(245,247,249,0.9) 50%, rgba(201,207,214,0.55) 65%, transparent)",
              }}
              initial={reduce ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.2 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, amount: "all" }}
              transition={{ duration: 1.2, ease: ease.entrance }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 -top-2 h-5 blur-md"
              style={{
                background:
                  "radial-gradient(60% 100% at 50% 0%, rgba(201,207,214,0.4), transparent 70%)",
              }}
            />
            {!reduce && (
              <motion.div
                aria-hidden
                className="absolute top-0 h-px w-24"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
                }}
                animate={{ left: ["-12%", "100%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
              />
            )}
          </div>

          <h2
            ref={headRef}
            className="mx-auto mt-9 max-w-[18ch] text-balance font-display text-display-sm font-extrabold leading-[0.9] tracking-tight text-fg md:mt-11 md:text-display-lg xl:text-display-xl"
          >
            {HEADLINE.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: "118%" }}
                  animate={reduce || headInView ? { y: "0%" } : { y: "118%" }}
                  transition={{ duration: 1.05, ease: ease.entrance, delay: 0.15 + i * 0.13 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-7 max-w-lg text-fg/70 md:text-lg">
              Открийте автомобила, който ще разказва вашата история — на живо в
              Пловдив или чрез нашата услуга по издирване и внос.
            </p>
          </FadeIn>

          <FadeIn delay={0.32}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/avtomobili" variant="solid" size="lg" arrow>
                Разгледай колекцията
              </ButtonLink>
              <ButtonLink href="/kontakti" variant="ghost" size="lg">
                Заявете автомобил
              </ButtonLink>
            </div>
          </FadeIn>
        </div>

        {/* Complete contact panel */}
        <FadeIn delay={0.42}>
          <div className="mx-auto mt-16 grid max-w-4xl overflow-hidden rounded-[1.25rem] panel-metal edge-light sm:grid-cols-3">
            {channels.map((c, i) => (
              <a
                key={c.label}
                href={c.href}
                className={`group flex items-start gap-4 p-6 transition-colors hover:bg-white/[0.03] md:p-7 ${
                  i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""
                }`}
              >
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent transition-colors group-hover:border-accent">
                  <c.Icon className="size-4" strokeWidth={1.6} />
                </span>
                <span className="min-w-0">
                  <span className="label-fine flex items-center gap-1 text-fg-subtle">
                    {c.label}
                    <ArrowUpRight className="size-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="mt-1.5 block truncate font-display text-base font-semibold text-fg">
                    {c.value}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-fg-muted">{c.sub}</span>
                </span>
              </a>
            ))}
          </div>
        </FadeIn>

        {/* Closing signature — a quiet credential bookend */}
        <FadeIn delay={0.5}>
          <div className="mt-14 flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {credentials.map(([value, label]) => (
                <div key={label} className="flex items-baseline gap-2.5">
                  <span className="font-display text-xl font-extrabold tracking-tight text-fg md:text-2xl">
                    {value}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-fg-muted">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 text-fg-subtle">
              <span className="h-px w-8 bg-line-strong" />
              <span className="label-fine">AutoHaus · Пловдив</span>
              <span className="h-px w-8 bg-line-strong" />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
