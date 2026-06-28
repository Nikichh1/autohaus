import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Check,
  Phone,
  ShieldCheck,
  CalendarCheck,
  KeyRound,
  Gauge,
} from "lucide-react";
import type { Vehicle } from "@/types";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/data/vehicles";
import { getSettingsGroup } from "@/lib/settings/read";
import type { FinancingSettings } from "@/lib/settings/config";
import { displayPrice, formatNumber, formatPriceEUR } from "@/lib/utils";
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

export const dynamic = "force-dynamic";

const BASE_URL = "https://autohaus.bg";

type PageProps = { params: Promise<{ slug: string }> };

/** Root-relative paths → absolute (for canonical / OG / JSON-LD); keep absolute as-is. */
function absUrl(path: string): string {
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

/** One-line spec summary used as a fallback meta description and OG copy. */
function vehicleSummary(v: Vehicle): string {
  return [
    `${v.year} г.`,
    `${formatNumber(v.mileage)} км`,
    fuelLabels[v.fuelType],
    transmissionLabels[v.transmission],
    v.power ? `${v.power} к.с.` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Prefer the real description; otherwise synthesise one from the specs. ≤160 chars. */
function metaDescription(v: Vehicle, fullLabel: string): string {
  const base = v.description?.trim();
  if (base) return base.slice(0, 160);
  return `${fullLabel} — ${vehicleSummary(v)}. Проверена история и писмена гаранция от AutoHaus, Пловдив.`.slice(
    0,
    160,
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};

  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, title);
  const canonical = `/avtomobili/${vehicle.slug}/`;
  const images = vehicle.images.slice(0, 4).map((url) => ({
    url: absUrl(url),
    alt: title,
  }));

  return {
    title,
    description,
    keywords: [
      vehicle.brand,
      vehicle.model,
      vehicle.variant,
      vehicle.bodyType,
      "автомобил",
      "продажба",
      "лизинг",
      "Пловдив",
    ].filter((k): k is string => Boolean(k)),
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} · AutoHaus`,
      description,
      url: canonical,
      images: images.length ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · AutoHaus`,
      description,
      images: images.map((i) => i.url),
    },
  };
}

/** Indicative monthly payment — same maths as FinancingCalculator, driven by the
 *  admin-managed financing settings (Настройки → Лизинг и финансиране). Shown as a
 *  teaser in the buy panel. */
function indicativeMonthly(price: number, f: FinancingSettings): number {
  if (price <= 0) return 0;
  const financed = price * (1 - f.downPaymentPct / 100);
  if (financed <= 0) return 0;
  const r = f.annualRatePct / 100 / 12;
  const n = f.termMonths;
  if (r <= 0) return Math.round(financed / n);
  return Math.round(
    (financed * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1),
  );
}

/** schema.org Car + Offer + BreadcrumbList for rich results. Only emits fields the
 *  listing actually has, and an Offer only for priced cars (skips "При запитване"). */
function buildJsonLd(
  vehicle: Vehicle,
  fullLabel: string,
  description: string,
  contact: { company: string; phone: string; street: string; city: string; postcode: string; country: string },
) {
  const canonicalUrl = absUrl(`/avtomobili/${vehicle.slug}/`);

  const engine: Record<string, unknown> = { "@type": "EngineSpecification" };
  if (vehicle.power)
    engine.enginePower = { "@type": "QuantitativeValue", value: vehicle.power, unitText: "к.с." };
  if (vehicle.torque)
    engine.torque = { "@type": "QuantitativeValue", value: vehicle.torque, unitText: "Nm" };
  if (vehicle.engineCC)
    engine.engineDisplacement = { "@type": "QuantitativeValue", value: vehicle.engineCC, unitCode: "CMQ" };

  const car: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: fullLabel,
    description,
    url: canonicalUrl,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    productionDate: String(vehicle.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" },
    fuelType: fuelLabels[vehicle.fuelType],
    vehicleTransmission: transmissionLabels[vehicle.transmission],
    driveWheelConfiguration: drivetrainLabels[vehicle.drivetrain],
    vehicleEngine: engine,
    image: vehicle.images.map(absUrl),
    ...(vehicle.variant ? { vehicleConfiguration: vehicle.variant } : {}),
    ...(vehicle.bodyType ? { bodyType: vehicle.bodyType } : {}),
    ...(vehicle.exteriorColor ? { color: vehicle.exteriorColor } : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    ...(vehicle.doors ? { numberOfDoors: vehicle.doors } : {}),
    ...(vehicle.seats ? { seatingCapacity: vehicle.seats } : {}),
    ...(vehicle.topSpeed
      ? { speed: { "@type": "QuantitativeValue", value: vehicle.topSpeed, unitCode: "KMH" } }
      : {}),
    ...(vehicle.acceleration
      ? { accelerationTime: { "@type": "QuantitativeValue", value: vehicle.acceleration, unitCode: "SEC" } }
      : {}),
  };

  if (vehicle.price > 0) {
    car.offers = {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: vehicle.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url: canonicalUrl,
      seller: {
        "@type": "AutoDealer",
        name: contact.company || "AutoHaus",
        ...(contact.phone ? { telephone: contact.phone } : {}),
        address: {
          "@type": "PostalAddress",
          ...(contact.street ? { streetAddress: contact.street } : {}),
          ...(contact.city ? { addressLocality: contact.city } : {}),
          ...(contact.postcode ? { postalCode: contact.postcode } : {}),
          addressCountry: "BG",
        },
      },
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Автомобили", item: `${BASE_URL}/avtomobili/` },
      { "@type": "ListItem", position: 3, name: fullLabel, item: canonicalUrl },
    ],
  };

  return [car, breadcrumb];
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  // Fetch the rest in parallel — all reads are React-cache deduped.
  const [similar, financing, contact] = await Promise.all([
    getSimilarVehicles(vehicle, 3),
    getSettingsGroup("financing"),
    getSettingsGroup("contact"),
  ]);

  const label = `${vehicle.brand} ${vehicle.model}`;
  const fullLabel = `${label}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, fullLabel);
  const monthly = indicativeMonthly(vehicle.price, financing);
  const phone = contact.phone?.trim() || contactInfo.phone;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const jsonLd = buildJsonLd(vehicle, fullLabel, description, contact);

  const quickChips = [
    `${vehicle.year}`,
    `${formatNumber(vehicle.mileage)} км`,
    fuelLabels[vehicle.fuelType],
    transmissionLabels[vehicle.transmission],
    drivetrainLabels[vehicle.drivetrain],
  ];

  // Mini-spec tiles — only render the ones this listing actually has.
  const miniSpecs = [
    { label: "Мощност", value: `${vehicle.power}`, unit: "к.с." },
    vehicle.torque
      ? { label: "Въртящ момент", value: `${vehicle.torque}`, unit: "Nm" }
      : null,
    vehicle.acceleration
      ? { label: "0–100 км/ч", value: `${vehicle.acceleration}`, unit: "сек" }
      : null,
    vehicle.topSpeed
      ? { label: "Макс. скорост", value: `${vehicle.topSpeed}`, unit: "км/ч" }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; unit: string }>;

  const highlights = vehicle.features.slice(0, 5);

  return (
    <article className="text-fg">
      <TrackView slug={vehicle.slug} />
      <script
        type="application/ld+json"
        // dealership-controlled data; escape `<` to keep the script tag intact
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* ─────────────  PRODUCT HERO — everything essential, first screen  ───────────── */}
      <div className="field-graphite pb-12 pt-28 md:pt-32">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <nav
            aria-label="Навигация"
            className="flex items-center gap-2 text-xs text-fg-muted"
          >
            <Link href="/" className="transition-colors hover:text-fg">
              Начало
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/avtomobili" className="transition-colors hover:text-fg">
              Автомобили
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="truncate text-fg" aria-current="page">
              {fullLabel}
            </span>
          </nav>
        </div>

        <div className="mx-auto mt-6 grid max-w-wide gap-8 px-4 md:px-8 lg:grid-cols-12 lg:gap-10 xl:px-12">
          {/* LEFT — gallery + equipment highlights */}
          <div className="lg:col-span-7">
            <VehicleGallery
              images={vehicle.images}
              alt={fullLabel}
              sizes="(min-width: 1024px) 760px, 100vw"
            />

            {highlights.length > 0 && (
              <FadeIn delay={0.15}>
                <div className="mt-7">
                  <p className="label-fine mb-3 text-fg-subtle">
                    Акценти в оборудването
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-white/[0.03] px-3.5 py-2 text-sm text-fg/90"
                      >
                        <Check
                          className="size-3.5 text-accent"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        {f}
                      </span>
                    ))}
                    <a
                      href="#equipment"
                      className="inline-flex items-center rounded-xl border border-dashed border-line-strong px-3.5 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      + цялото оборудване
                    </a>
                  </div>
                </div>
              </FadeIn>
            )}
          </div>

          {/* RIGHT — sticky buy panel */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <FadeIn delay={0.1}>
                <div className="panel-metal edge-light sheen relative overflow-hidden rounded-[1.25rem] p-6 md:p-7">
                  <p className="flex items-center gap-3 text-accent">
                    <span className="h-px w-7 bg-accent/50" />
                    <span className="label-fine">{vehicle.brand}</span>
                  </p>
                  <h1 className="mt-3 font-display text-display-2xs font-extrabold leading-[0.98] tracking-tight text-fg md:text-display-xs">
                    {vehicle.model}
                    {vehicle.variant && (
                      <span className="block text-fg-muted">
                        {vehicle.variant}
                      </span>
                    )}
                  </h1>

                  {/* Price + monthly */}
                  <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-display-2xs font-extrabold leading-none tracking-tight text-titanium">
                      {displayPrice(vehicle.price)}
                    </span>
                    {monthly > 0 && (
                      <a
                        href="#financing"
                        className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-accent"
                      >
                        ≈ {formatPriceEUR(monthly)} / мес
                        <ChevronRight className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>

                  {/* Quick chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {quickChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium tabular-nums text-fg-muted"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex gap-2.5">
                    <a
                      href="#inquiry"
                      className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-fg text-sm font-medium text-ink transition-colors hover:bg-accent"
                    >
                      <CalendarCheck className="size-4" aria-hidden />
                      Запазете оглед
                    </a>
                    <a
                      href={telHref}
                      aria-label={`Обади се на ${phone}`}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
                    >
                      <Phone className="size-4" aria-hidden />
                      Обади се
                    </a>
                  </div>

                  {/* Mini specs */}
                  {miniSpecs.length > 0 && (
                    <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line-strong bg-line">
                      {miniSpecs.map((s) => (
                        <div
                          key={s.label}
                          className="bg-gradient-to-b from-[#191c22] to-[#0f1216] px-4 py-3.5"
                        >
                          <dt className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
                            {s.label}
                          </dt>
                          <dd className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">
                            {s.value}{" "}
                            <span className="text-sm font-medium text-fg-muted">
                              {s.unit}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* Engine sound — compact, fits the panel */}
                  {vehicle.engineSound && (
                    <div className="mt-5">
                      <p className="label-fine mb-2.5 flex items-center gap-2 text-fg-subtle">
                        <Gauge className="size-3.5 text-accent" strokeWidth={1.8} aria-hidden />
                        Звук на двигателя
                      </p>
                      <EngineSoundPlayer
                        sound={vehicle.engineSound}
                        compact
                        className="bg-black/30"
                      />
                    </div>
                  )}

                  {/* Trust + rental */}
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-5 text-sm text-fg-muted">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                      Писмена гаранция
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="size-4 text-accent" strokeWidth={2} aria-hidden />
                      Проверена история
                    </span>
                    {vehicle.rentalPerDay !== undefined && (
                      <a
                        href={`/kontakti?vehicle=${encodeURIComponent(fullLabel + " (под наем)")}`}
                        className="flex items-center gap-2 transition-colors hover:text-accent"
                      >
                        <KeyRound className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                        Под наем от {formatNumber(vehicle.rentalPerDay)} €/ден
                      </a>
                    )}
                  </div>
                </div>
              </FadeIn>

              {/* Description — serif, under the panel */}
              {vehicle.description?.trim() && (
                <FadeIn delay={0.15}>
                  <p className="mt-6 px-1 font-serif text-lg italic leading-relaxed text-fg/80">
                    {vehicle.description}
                  </p>
                </FadeIn>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────  EMOTIONAL DEEP-DIVE (lighter graphite body)  ───────────── */}
      <div className="field-graphite-soft relative border-t border-line pb-28 pt-20 text-fg">
        <div aria-hidden className="edge-light pointer-events-none absolute inset-x-0 top-0 h-px" />

        {/* Performance — big editorial numbers */}
        <section className="relative mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <FadeIn>
            <h2 className="label-fine mb-5 text-fg-subtle">Перформанс</h2>
          </FadeIn>
          <SpecHighlights vehicle={vehicle} />
        </section>

        {/* Equipment + full specification */}
        {vehicle.features.length > 0 ? (
          <div
            id="equipment"
            className="mx-auto mt-24 grid max-w-wide scroll-mt-28 gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-16 xl:px-12"
          >
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
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-accent"
                        strokeWidth={2}
                        aria-hidden
                      />
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
          <div
            id="equipment"
            className="mx-auto mt-24 max-w-3xl scroll-mt-28 px-4 md:px-8 xl:px-12"
          >
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

        {/* Financing — admin-managed rate/term, skipped for "При запитване" */}
        {vehicle.price > 0 && (
          <section
            id="financing"
            className="mx-auto mt-28 max-w-wide scroll-mt-28 px-4 md:px-8 xl:px-12"
          >
            <FadeIn>
              <FinancingCalculator
                price={vehicle.price}
                annualRatePct={financing.annualRatePct}
                downPaymentPct={financing.downPaymentPct}
                termMonths={financing.termMonths}
              />
            </FadeIn>
          </section>
        )}

        {/* Inquiry */}
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

      <VehicleStickyBar vehicle={vehicle} phone={phone} />
    </article>
  );
}
