"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone, Globe2, Search, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { contactInfo } from "@/lib/nav";
import { ease } from "@/lib/motion";

const HEADLINE = ["Мечтаната кола —", "намерена и доставена."];

const steps = [
  {
    n: "01",
    Icon: Search,
    title: "Опишете автомобила",
    body: "Марка, модел, спецификация и бюджет — колкото и специфично да е желанието ви.",
  },
  {
    n: "02",
    Icon: Globe2,
    title: "Издирваме и проверяваме",
    body: "Активираме международна мрежа от партньори и проверяваме произход, история и състояние.",
  },
  {
    n: "03",
    Icon: ShieldCheck,
    title: "Доставяме до Пловдив",
    body: "Поемаме вноса, документите и регистрацията. Вие получавате готов, проверен автомобил.",
  },
];

const marques = [
  "Porsche",
  "Ferrari",
  "Lamborghini",
  "Rolls-Royce",
  "Bentley",
  "Mercedes-AMG",
  "BMW M",
  "Aston Martin",
  "McLaren",
  "Maserati",
];

/**
 * Concierge — bespoke sourcing & import. A spotlit dark stage: the sourced
 * GT3 RS lit like a reveal beside a glass request console, on a layered graphite
 * field with titanium accents. Built to draw the eye and convert, desktop + mobile.
 */
export function ConciergeScene() {
  const reduce = useReducedMotion();
  // Observe the stable heading (not the clip-revealed inner spans, whose offset
  // box can fail to register as in-view) so the title reliably animates in.
  const headRef = useRef<HTMLHeadingElement>(null);
  const headInView = useInView(headRef, { once: true, amount: 0.2 });

  return (
    <section className="field-graphite relative overflow-hidden py-[13vh] text-fg md:py-[16vh]">
      {/* layered depth: cool spotlight + faint red ambient from the car + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 80% 38%, rgba(201,207,214,0.12), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 42% at 76% 60%, rgba(208,72,56,0.12), transparent 66%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 78%)",
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative z-10 mx-auto max-w-wide px-4 md:px-8 xl:px-12">
        {/* ── Hero: title + console (left) · sourced machine (right) ── */}
        <div className="grid gap-x-12 gap-y-9 lg:grid-cols-12 lg:gap-y-12">
          {/* Title */}
          <div className="lg:col-span-6 lg:row-start-1">
            <FadeIn>
              <ChapterLabel index="04" label="Издирване и внос" />
            </FadeIn>
            <h2
              ref={headRef}
              className="mt-6 max-w-[16ch] text-balance font-display text-display-sm font-extrabold leading-[0.96] tracking-tight text-fg md:text-display-md"
            >
              {HEADLINE.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={reduce ? false : { y: "115%" }}
                    animate={reduce || headInView ? { y: "0%" } : { y: "115%" }}
                    transition={{ duration: 1, ease: ease.entrance, delay: 0.06 + i * 0.12 }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>
            <FadeIn delay={0.14}>
              <p className="mt-6 max-w-lg text-fg-muted md:text-lg">
                Дори когато търсеният автомобил не е в нашата зала, го откриваме чрез
                проверена международна мрежа, инспектираме всеки детайл и го доставяме
                до Пловдив — напълно прозрачно.
              </p>
            </FadeIn>
          </div>

          {/* Sourced machine — spotlit (drops below the form on mobile) */}
          <FadeIn delay={0.1} className="order-3 lg:order-none lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:self-stretch">
            <div className="relative h-full">
              {/* glow pools behind the frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 md:-inset-10"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(201,207,214,0.2), transparent 76%)",
                }}
              />
              <div className="sheen edge-light group relative h-full overflow-hidden rounded-[1.5rem] border border-line-strong shadow-cinema">
                <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[32rem]">
                  <Image
                    src="/photos/porsche-gt3rs.webp"
                    alt="Porsche 911 GT3 RS — издирен за клиент"
                    fill
                    quality={92}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  {/* cinematic depth */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/85 via-transparent to-base/10" />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(120% 95% at 50% 42%, transparent 52%, rgba(8,9,12,0.55) 100%)",
                    }}
                  />
                  {/* machined corner accents */}
                  <span aria-hidden className="absolute left-5 top-5 size-9 border-l border-t border-white/30" />
                  <span aria-hidden className="absolute right-5 top-5 size-9 border-r border-t border-white/30" />
                  {/* caption */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
                    <div>
                      <p className="label-fine text-accent">Издирен за клиент</p>
                      <p className="mt-2 font-display text-xl font-bold tracking-tight text-white md:text-2xl">
                        Porsche 911 GT3 RS
                      </p>
                    </div>
                    <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                      <Globe2 className="size-3.5 text-accent" strokeWidth={1.7} />
                      <span className="label-fine text-white">Внос</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Request console — glass (sits right under the title on mobile so the
              ask fills the space instead of a gap before the image) */}
          <FadeIn delay={0.18} className="order-2 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2">
            <div className="panel-glass edge-light rounded-[1.25rem] p-5 md:p-6">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-accent" strokeWidth={1.7} />
                <p className="label-fine text-fg-muted">Опишете автомобила, който търсите</p>
              </div>
              <ConciergeRequest />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
                >
                  <Phone className="size-4" strokeWidth={1.7} />
                  <span className="tabular-nums">{contactInfo.phone}</span>
                </a>
                <span className="flex items-center gap-2 text-xs text-fg-subtle">
                  <Globe2 className="size-3.5 text-accent" strokeWidth={1.6} />
                  Глобална мрежа
                </span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── Process — machined metal cards ── */}
        <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3 md:gap-5">
          {steps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.08}>
              <div className="panel-metal edge-light h-full rounded-[1.25rem] p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full border border-line-strong text-accent">
                    <s.Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="font-display text-sm font-semibold tabular-nums text-fg-subtle">
                    {s.n} / 03
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-fg md:text-xl">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── Breadth of sourcing ── */}
        <div className="mt-14 border-t border-line pt-10 text-center md:mt-20 md:pt-12">
          <Reveal className="inline-block">
            <p className="font-display text-xl font-bold tracking-tight text-fg sm:text-2xl md:text-3xl">
              От всяка марка. <span className="text-fg-muted">От всеки пазар.</span>
            </p>
          </Reveal>
          <div className="mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8">
            {marques.map((m) => (
              <span
                key={m}
                className="font-display text-sm font-semibold tracking-tight text-fg/30 transition-colors hover:text-fg/70 sm:text-base"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Concierge request entry — one elegant ask, routed to the contact desk. */
function ConciergeRequest() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/kontakti?vehicle=${encodeURIComponent(q)}` : "/kontakti");
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="напр. Porsche 911 GT3 RS, BMW M5 Touring…"
        aria-label="Опишете автомобила, който търсите"
        className="h-14 w-full rounded-full border border-line-strong bg-white/5 px-5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/60 focus:outline-none sm:flex-1"
      />
      <button
        type="submit"
        className="group/btn relative inline-flex h-14 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-fg px-7 text-sm font-medium text-ink transition-colors hover:bg-accent"
      >
        Заявете
        <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      </button>
    </form>
  );
}
