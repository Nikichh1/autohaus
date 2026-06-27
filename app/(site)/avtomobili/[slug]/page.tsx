import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, Phone, ShieldCheck, CalendarCheck, KeyRound } from "lucide-react";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/data/vehicles";
import { displayPrice, formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";
import { contactInfo } from "@/lib/nav";
import { VehicleGallery } from "@/components/vehicle/VehicleGallery";
import { SpecHighlights } from "@/components/vehicle/SpecHighlights";
import { SpecTable } from "@/components/vehicle/SpecTable";
import { FinancingCalculator } from "@/components/vehicle/FinancingCalculator";
import { VehicleInquiryForm } from "@/components/vehicle/VehicleInquiryForm";
import { VehicleStickyBar } from "@/components/vehicle/VehicleStickyBar";
import { VehicleProvenance } from "@/components/vehicle/VehicleProvenance";
import { SimilarVehicles } from "@/components/vehicle/SimilarVehicles";
import { EngineSoundPlayer } from "@/components/vehicle/EngineSoundPlayer";
import { TrackView } from "@/components/vehicle/TrackView";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = vehicle.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title: `${title} · AutoHaus`,
      description,
      images: vehicle.images[0] ? [{ url: vehicle.images[0] }] : undefined,
    },
  };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const similar = await getSimilarVehicles(vehicle, 3);
  const label = `${vehicle.brand} ${vehicle.model}`;
  const fullLabel = `${label}${vehicle.variant ? " " + vehicle.variant : ""}`;

  const quickChips = [
    `${vehicle.year}`,
    `${formatNumber(vehicle.mileage)} км`,
    fuelLabels[vehicle.fuelType],
    transmissionLabels[vehicle.transmission],
    drivetrainLabels[vehicle.drivetrain],
  ];

  return (
    <article className="text-fg">
      <TrackView slug={vehicle.slug} />
      {/* ── Dark cinematic top: gallery + identity + engine sound ── */}
      <div className="field-graphite pb-16">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-wide px-4 pt-28 md:px-8 md:pt-32 xl:px-12">
        <nav className="flex items-center gap-2 text-xs text-fg-muted">
          <Link href="/" className="transition-colors hover:text-fg">
            Начало
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/avtomobili" className="transition-colors hover:text-fg">
            Автомобили
          </Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-fg">{fullLabel}</span>
        </nav>
      </div>

      {/* Gallery */}
      <div className="mx-auto mt-6 max-w-wide px-4 md:px-8 xl:px-12">
        <VehicleGallery images={vehicle.images} alt={fullLabel} />
      </div>

      {/* Header — identity + machined purchase panel */}
      <header className="mx-auto mt-12 max-w-wide px-4 md:px-8 xl:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
          <div className="lg:col-span-7 lg:row-start-1">
            <FadeIn>
              <p className="flex items-center gap-3 text-accent">
                <span className="h-px w-8 bg-accent/50" />
                <span className="label-fine">{vehicle.brand}</span>
              </p>
            </FadeIn>
            <Reveal>
              <h1 className="mt-5 font-display text-display-sm font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-md">
                {vehicle.model}
                {vehicle.variant && (
                  <span className="block text-fg-muted">{vehicle.variant}</span>
                )}
              </h1>
            </Reveal>
            <FadeIn delay={0.15}>
              <div className="mt-7 flex flex-wrap gap-2">
                {quickChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-line-strong bg-elevated px-3.5 py-1.5 text-xs font-medium tabular-nums text-fg-muted"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Purchase panel */}
          <FadeIn delay={0.1} className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-start">
            <div className="panel-metal edge-light sheen relative overflow-hidden rounded-[1.25rem] p-7 md:p-8">
              <p className="label-fine text-fg-subtle">Цена</p>
              <p className="mt-2 font-display text-display-xs font-extrabold leading-none tracking-tight text-titanium">
                {displayPrice(vehicle.price)}
              </p>
              {vehicle.price > 0 && (
                <a
                  href="#financing"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-accent"
                >
                  Лизинг и финансиране
                  <ChevronRight className="size-3.5" />
                </a>
              )}

              <div className="mt-7 flex flex-col gap-3">
                <a
                  href="#inquiry"
                  className="group/btn relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-fg text-sm font-medium text-ink transition-colors hover:bg-accent"
                >
                  <CalendarCheck className="size-4" />
                  Запазете оглед
                </a>
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line-strong text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
                >
                  <Phone className="size-4" />
                  {contactInfo.phone}
                </a>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 border-t border-line pt-6 text-sm sm:grid-cols-2">
                <span className="flex items-center gap-2.5 text-fg-muted">
                  <ShieldCheck className="size-4 text-accent" strokeWidth={1.6} />
                  Писмена гаранция
                </span>
                <span className="flex items-center gap-2.5 text-fg-muted">
                  <Check className="size-4 text-accent" strokeWidth={2} />
                  Проверена история
                </span>
              </div>

              {vehicle.rentalPerDay !== undefined && (
                <div className="mt-6 rounded-xl border border-line-strong bg-gradient-to-b from-[#191c22] to-[#0f1216] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="label-fine text-fg-subtle">Достъпен и под наем</p>
                      <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums text-fg">
                        от {formatNumber(vehicle.rentalPerDay)} €
                        <span className="text-sm font-medium text-fg-muted">/ден</span>
                      </p>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent">
                      <KeyRound className="size-4" strokeWidth={1.6} />
                    </span>
                  </div>
                  <a
                    href={`/kontakti?vehicle=${encodeURIComponent(fullLabel + " (под наем)")}`}
                    className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
                  >
                    <KeyRound className="size-4" />
                    Запитване за наем
                  </a>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Description — sits below the identity (left), after the price on mobile */}
          <FadeIn delay={0.15} className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <p className="max-w-xl font-serif text-xl italic leading-relaxed text-fg/85 md:text-2xl">
              {vehicle.description}
            </p>
          </FadeIn>
        </div>
      </header>

      {/* Engine sound — signature feature */}
      {vehicle.engineSound && (
        <section className="mx-auto mt-16 max-w-wide px-4 md:px-8 xl:px-12">
          <FadeIn>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-line-strong bg-gradient-to-br from-[#15181e] to-[#0c0e12] p-6 md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(201,207,214,0.18), transparent 70%)" }}
              />
              <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-fine text-accent">Сигнатура</p>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
                    Чуйте двигателя
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm text-fg-muted">
                    Истински запис на този автомобил — не симулация. Натиснете play.
                  </p>
                </div>
                <span className="hidden rounded-full border border-line-strong bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-fg-muted sm:inline-flex">
                  {vehicle.power} к.с.
                </span>
              </div>
              <EngineSoundPlayer
                sound={vehicle.engineSound}
                title={`${vehicle.brand} ${vehicle.model}`}
                subtitle="Истински запис"
                className="relative bg-black/30"
              />
            </div>
          </FadeIn>
        </section>
      )}
      </div>
      {/* ── /Dark top ── */}

      {/* ── Lighter graphite editorial body (two-tone relief, keeps text correct) ── */}
      <div className="field-graphite-soft relative border-t border-line pb-28 pt-16 text-fg">
      <div aria-hidden className="edge-light pointer-events-none absolute inset-x-0 top-0 h-px" />

      {/* Performance — premium stat block */}
      <section className="relative mx-auto mt-4 max-w-wide px-4 md:px-8 xl:px-12">
        <FadeIn>
          <p className="label-fine mb-5 text-fg-subtle">Технически характеристики</p>
        </FadeIn>
        <SpecHighlights vehicle={vehicle} />
      </section>

      {/* Equipment (when listed) + full spec table */}
      {vehicle.features.length > 0 ? (
        <div className="mx-auto mt-24 grid max-w-wide gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-16 xl:px-12">
          <div className="lg:col-span-7">
            <FadeIn>
              <h2 className="font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
                Оборудване
              </h2>
            </FadeIn>
            <FadeIn>
              <ul className="mt-8 grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
                {vehicle.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 border-b border-line py-4"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} />
                    <span className="text-sm text-fg/90">{feature}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <FadeIn>
                <div className="panel-metal edge-light overflow-hidden rounded-[1.25rem] p-6 md:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                    Пълна спецификация
                  </h2>
                  <div className="mt-6">
                    <SpecTable vehicle={vehicle} />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-24 max-w-3xl px-4 md:px-8 xl:px-12">
          <FadeIn>
            <div className="panel-metal edge-light overflow-hidden rounded-[1.25rem] p-6 md:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                Пълна спецификация
              </h2>
              <div className="mt-6">
                <SpecTable vehicle={vehicle} />
              </div>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Transparent history / certification */}
      <section className="mx-auto mt-28 max-w-wide px-4 md:px-8 xl:px-12">
        <VehicleProvenance vehicle={vehicle} />
      </section>

      {/* Financing — only for priced vehicles (skip "On request") */}
      {vehicle.price > 0 && (
        <section
          id="financing"
          className="mx-auto mt-28 max-w-wide scroll-mt-28 px-4 md:px-8 xl:px-12"
        >
          <FadeIn>
            <FinancingCalculator price={vehicle.price} />
          </FadeIn>
        </section>
      )}

      {/* Inquiry form */}
      <section
        id="inquiry"
        className="mx-auto mt-28 max-w-wide scroll-mt-28 px-4 md:px-8 xl:px-12"
      >
        <VehicleInquiryForm vehicleLabel={fullLabel} vehicleSlug={vehicle.slug} />
      </section>

      {/* Similar */}
      <section className="mx-auto mt-32 max-w-wide px-4 md:px-8 xl:px-12">
        <SimilarVehicles vehicles={similar} />
      </section>
      </div>
      {/* ── /Light body ── */}

      <VehicleStickyBar vehicle={vehicle} />
    </article>
  );
}
