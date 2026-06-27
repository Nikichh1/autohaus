import type { Vehicle } from "@/types";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { CollectionContinuation } from "./CollectionContinuation";

type Ghost = { id: string; image: string; label: string };
type Props = { vehicles: Vehicle[]; ghosts: Ghost[]; total: number };

/**
 * The Collection — an equal-weight grid of featured inventory. No single car is
 * elevated above the rest; every vehicle gets the same photography-first card.
 * Below the grid the collection "recedes" into blurred previews that hand off to
 * a polished CTA and the cinematic transition to the full inventory.
 */
export function Collection({ vehicles, ghosts, total }: Props) {
  if (!vehicles.length) return null;

  return (
    <section className="light relative overflow-hidden bg-[#eef0f2] pt-[16vh]">
      <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
        {/* Section header */}
        <div className="max-w-2xl">
          <FadeIn>
            <ChapterLabel index="02" label="Подбрани от нас" />
          </FadeIn>
          <Reveal>
            <h2 className="mt-5 font-display text-display-sm font-bold leading-[0.95] tracking-tight text-fg md:text-display-md">
              Колекция.
            </h2>
          </Reveal>
          <FadeIn delay={0.12}>
            <p className="mt-5 max-w-md text-fg-muted md:text-lg">
              Малка по обем, безкомпромисна по подбор. Всеки автомобил —
              проверен, с история и готов за пътя.
            </p>
          </FadeIn>
        </div>

        {/* Equal-weight grid — no car prioritised over another */}
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {vehicles.map((v, i) => (
            <FadeIn key={v.id} delay={(i % 3) * 0.08}>
              <VehicleCard vehicle={v} />
            </FadeIn>
          ))}
        </div>
      </div>

      {/* The collection continues → receding previews + premium cinematic CTA */}
      <CollectionContinuation ghosts={ghosts} total={total} />
    </section>
  );
}
