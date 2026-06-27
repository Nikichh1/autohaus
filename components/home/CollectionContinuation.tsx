"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePageTransition } from "@/components/transition/PageTransition";

type Ghost = { id: string; image: string; label: string };

/**
 * The collection doesn't end — it keeps going just out of sight. Only the upper
 * sliver of the next row of cards peeks up from below (heavily blurred + faded),
 * implying many more vehicles underneath. A single polished CTA fires the
 * cinematic page slide instantly on click — as responsive as a plain nav link,
 * with no handoff delay.
 */
export function CollectionContinuation({
  ghosts,
  total,
}: {
  ghosts: Ghost[];
  total: number;
}) {
  const { navigate } = usePageTransition();
  const reduce = useReducedMotion();
  const router = useRouter();

  // Warm the Vehicles route up front (like a Next <Link> does) so clicking the
  // CTA starts the transition immediately instead of waiting for it to load.
  useEffect(() => {
    router.prefetch("/avtomobili");
  }, [router]);

  return (
    <div className="relative mt-12 md:mt-16">
      {/* Only the tops of the next cards surface from below — the rest stays
          hidden, hinting at a much deeper inventory. */}
      <div
        aria-hidden
        className="pointer-events-none mx-auto max-w-wide px-4 md:px-8 xl:px-12"
      >
        <div
          className="grid grid-cols-2 gap-x-8 overflow-hidden md:grid-cols-3"
          style={{
            height: "clamp(56px, 8vw, 104px)",
            maskImage:
              "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
          }}
        >
          {ghosts.slice(0, 3).map((g, i) => (
            <div
              key={`${g.id}-${i}`}
              className={cn(
                "relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-elevated ring-1 ring-line",
                i === 2 && "hidden md:block",
              )}
              style={{ filter: "blur(4px)", opacity: 0.5 }}
            >
              <Image
                src={g.image}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Premium CTA */}
      <div className="relative z-10 mt-12 flex flex-col items-center px-4 pb-[16vh] text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="label-fine text-fg-subtle"
        >
          Колекцията продължава
        </motion.p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate("/avtomobili")}
            onPointerEnter={() => router.prefetch("/avtomobili")}
            onFocus={() => router.prefetch("/avtomobili")}
            aria-label={`Разгледайте всички автомобили — ${total} в наличност`}
            className="group relative inline-flex h-14 max-w-full items-center gap-3 overflow-hidden rounded-full bg-fg pl-6 pr-2.5 text-ink shadow-luxe transition-transform duration-150 ease-out active:scale-[0.97] md:h-16 md:gap-5 md:pl-9 md:pr-3"
          >
            {/* polished sheen sweep on hover */}
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.28)_50%,transparent_58%)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
            />
            <span className="relative z-10 whitespace-nowrap font-display text-sm font-bold tracking-tight md:text-lg">
              Разгледайте всички автомобили
            </span>
            <span className="relative z-10 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-fg md:size-11">
              <ArrowRight className="size-[1.1rem] transition-transform duration-150 ease-out group-hover:translate-x-1 md:size-5" />
            </span>
          </button>
        </div>

        <p className="mt-5 text-xs font-medium text-fg-muted">
          {total} автомобила в наличност
        </p>
      </div>
    </div>
  );
}
