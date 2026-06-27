import { ShieldCheck, Gauge, FileCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { ChapterLabel } from "@/components/ui/ChapterLabel";

const standards = [
  {
    n: "01",
    Icon: ShieldCheck,
    title: "Писмена гаранция",
    body: "Ясни условия в писмен вид — спокойствие, което започва от подписа, не от обещанието.",
  },
  {
    n: "02",
    Icon: Gauge,
    title: "Мултиточкова проверка",
    body: "Над 100 точки техническа диагностика. Нито един автомобил не влиза в залата без нея.",
  },
  {
    n: "03",
    Icon: FileCheck,
    title: "Проверена история",
    body: "Произход, обслужване и автентичен пробег — документирани и проверими.",
  },
  {
    n: "04",
    Icon: Wrench,
    title: "Всичко под един покрив",
    body: "Лизинг, застраховки, сервиз и Auto Spa — грижата продължава дълго след покупката.",
  },
];

/**
 * The Standard — why buy through AutoHaus. Every car, in stock or sourced to
 * order, clears the same uncompromising bar. Concrete guarantees, not slogans.
 */
export function StandardScene() {
  return (
    <section className="light bg-[#edeef1] py-[16vh]">
      <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
          {/* Left — the argument */}
          <div className="lg:col-span-5">
            <FadeIn>
              <ChapterLabel index="05" label="Стандартът" />
            </FadeIn>
            <Reveal>
              <h2 className="mt-6 font-display text-display-sm font-extrabold leading-[0.96] tracking-tight text-fg md:text-display-md">
                Един стандарт.
                <span className="block text-fg-muted">Без компромис.</span>
              </h2>
            </Reveal>
            <FadeIn delay={0.12}>
              <p className="mt-6 max-w-md text-fg-muted md:text-lg">
                Всеки автомобил — наличен или поръчан — преминава през един и същ
                безкомпромисен процес, преди да получи нов собственик.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-8 max-w-md border-l border-line-strong pl-5 font-display text-lg font-medium leading-snug text-fg">
                Над две десетилетия. Хиляди доставени автомобила. Една репутация,
                която не подлежи на преговори.
              </p>
            </FadeIn>
            <FadeIn delay={0.28}>
              <div className="mt-9">
                <ButtonLink href="/za-nas" variant="ghost" size="md" arrow>
                  Повече за нас
                </ButtonLink>
              </div>
            </FadeIn>
          </div>

          {/* Right — the proof */}
          <div className="lg:col-span-7">
            <ul>
              {standards.map((s, i) => (
                <FadeIn key={s.n} delay={i * 0.07}>
                  <li className="flex items-start gap-6 border-b border-line py-7 first:border-t">
                    <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent">
                      <s.Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-display text-xl font-bold tracking-tight text-fg">
                          {s.title}
                        </h3>
                        <span className="font-display text-sm font-semibold tabular-nums text-fg-subtle">
                          {s.n}
                        </span>
                      </div>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
                        {s.body}
                      </p>
                    </div>
                  </li>
                </FadeIn>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
