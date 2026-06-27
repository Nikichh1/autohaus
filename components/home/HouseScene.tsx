import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { ScrollTilt } from "@/components/motion/ScrollTilt";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { contactInfo } from "@/lib/nav";

const experiences = [
  {
    href: "/avtomobili",
    img: "/photos/showroom-bentley.webp",
    label: "Шоурум",
    desc: "Колекцията на живо, без бързане",
  },
  {
    href: "/auto-spa",
    img: "/photos/detail-headlight.webp",
    label: "Auto Spa",
    desc: "Детайлинг и керамични покрития",
  },
  {
    href: "/kafe-bar",
    img: "/photos/cafe-terrace.webp",
    label: "Кафе бар",
    desc: "Пространство за гости и партньори",
  },
];

/**
 * The House — the physical destination. The dealership at dusk as a cinematic
 * band, the experiences under one roof (each links to its page), and a confident
 * invitation to visit. Real-place trust + a quiet conversion path to services.
 */
export function HouseScene() {
  return (
    <section className="light relative bg-[#eef0f2] py-[16vh]">
      <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
        {/* Intro */}
        <div className="max-w-2xl">
          <FadeIn>
            <ChapterLabel index="06" label="Изживяването" />
          </FadeIn>
          <Reveal>
            <h2 className="mt-6 max-w-[16ch] text-balance font-display text-display-sm font-bold leading-[0.98] tracking-tight text-fg md:text-display-md">
              Повече от място за покупка.
            </h2>
          </Reveal>
          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-xl text-fg-muted md:text-lg">
              Шоурум, сервиз, детайлинг и кафе под един покрив в Пловдив — място,
              на което се отбивате, не само заради автомобила.
            </p>
          </FadeIn>
        </div>

        {/* Cinematic building band */}
        <div className="mt-14">
          <ScrollTilt tilt={4}>
            <Link
              href="/kontakti"
              className="group relative block overflow-hidden rounded-[1.5rem] shadow-luxe"
            >
              <MaskReveal className="aspect-[16/10] w-full sm:aspect-[2/1] lg:aspect-[21/9]">
                <Image
                  src="/photos/building-dusk.webp"
                  alt="Шоурумът на AutoHaus в Пловдив по здрач"
                  fill
                  quality={92}
                  sizes="(min-width: 1536px) 90vw, 100vw"
                  className="object-cover object-[center_62%] transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              </MaskReveal>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 md:p-10">
                <div>
                  <p className="label-fine text-white/70">Аутохаус · Пловдив</p>
                  <p className="mt-2 font-display text-xl font-semibold text-white md:text-2xl">
                    Шоурум · Сервиз · Auto Spa · Кафе
                  </p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </Link>
          </ScrollTilt>
        </div>

        {/* Experiences under one roof */}
        <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-3">
          {experiences.map((e, i) => (
            <FadeIn key={e.href} delay={i * 0.08}>
              <Link href={e.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-elevated">
                  <Image
                    src={e.img}
                    alt={e.label}
                    fill
                    sizes="(min-width: 768px) 30vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="font-display text-lg font-bold text-white">{e.label}</p>
                      <p className="mt-0.5 text-xs text-white/75">{e.desc}</p>
                    </div>
                    <ArrowUpRight className="size-5 text-white/80 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* Visit */}
        <FadeIn>
          <div className="mt-12 flex flex-col items-start justify-between gap-7 rounded-2xl border border-line bg-surface px-7 py-8 md:flex-row md:items-center md:px-10">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent">
                <MapPin className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-fg">
                  {contactInfo.address.street}, {contactInfo.address.city}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {contactInfo.address.area} · {contactInfo.hours[0].days}{" "}
                  {contactInfo.hours[0].time}
                </p>
              </div>
            </div>
            <ButtonLink href="/kontakti" variant="ghost" size="lg" arrow>
              Резервирайте посещение
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
