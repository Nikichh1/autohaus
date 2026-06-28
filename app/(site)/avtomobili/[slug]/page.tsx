import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ShieldCheck, KeyRound, MapPin, Phone } from "lucide-react";
import type { Vehicle } from "@/types";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/data/vehicles";
import { getSettingsGroup } from "@/lib/settings/read";
import type { FinancingSettings } from "@/lib/settings/config";
import { collections } from "@/lib/collections";
import { formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";
import { contactInfo } from "@/lib/nav";
import { CinematicHero } from "@/components/vehicle/CinematicHero";
import { ProductLoader } from "@/components/vehicle/ProductLoader";
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
import { Parallax } from "@/components/motion/Parallax";
import { Marquee } from "@/components/motion/Marquee";
import { BlurImage } from "@/components/motion/BlurImage";

export const dynamic = "force-dynamic";

const BASE_URL = "https://autohaus.bg";

type PageProps = { params: Promise<{ slug: string }> };

const collectionLabel = (slug: Vehicle["collection"]): string =>
  collections.find((c) => c.slug === slug)?.label ?? "";

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
 *  admin-managed financing settings (Настройки → Лизинг и финансиране). */
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

  const [similar, financing, contact] = await Promise.all([
    getSimilarVehicles(vehicle, 3),
    getSettingsGroup("financing"),
    getSettingsGroup("contact"),
  ]);

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, fullLabel);
  const monthly = indicativeMonthly(vehicle.price, financing);
  const phone = contact.phone?.trim() || contactInfo.phone;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const locationText = [contact.city, contact.street].filter(Boolean).join(", ");
  const jsonLd = buildJsonLd(vehicle, fullLabel, description, contact);
  const collLabel = collectionLabel(vehicle.collection);
  const detailImage = vehicle.images[1] ?? vehicle.images[0];

  // Floating callouts over the detail showcase — whatever this listing has.
  const detailCallouts = [
    vehicle.torque ? { value: `${vehicle.torque}`, unit: "Nm", label: "Въртящ момент" } : null,
    vehicle.engineCC ? { value: formatNumber(vehicle.engineCC), unit: "см³", label: "Двигател" } : null,
    vehicle.seats ? { value: `${vehicle.seats}`, unit: "места", label: "Капацитет" } : null,
  ].filter(Boolean).slice(0, 2) as Array<{ value: string; unit: string; label: string }>;

  const highlights = vehicle.features;

  return (
    <article className="vehicle-detail text-fg">
      <TrackView slug={vehicle.slug} />
      <ProductLoader slug={vehicle.slug} brand={vehicle.brand} model={vehicle.model} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* ═══════════════  HERO  ═══════════════ */}
      <CinematicHero vehicle={vehicle} phone={phone} monthly={monthly} collLabel={collLabel} />

      {/* ═══════════════  ASSURANCES STRIP  ═══════════════ */}
      <section className="relative z-10 border-y border-line bg-[#0a0c10]">
        <div className="mx-auto flex max-w-wide flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 text-sm text-fg-muted md:justify-between md:px-8 xl:px-12">
          <span className="flex items-center gap-2.5">
            <ShieldCheck className="size-4" strokeWidth={1.7} style={{ color: "var(--vg)" }} aria-hidden />
            Писмена гаранция
          </span>
          <span className="flex items-center gap-2.5">
            <Check className="size-4" strokeWidth={2} style={{ color: "var(--vg)" }} aria-hidden />
            Проверена история
          </span>
          <span className="hidden items-center gap-2.5 md:flex">
            <Check className="size-4" strokeWidth={2} style={{ color: "var(--vg)" }} aria-hidden />
            Мултиточкова проверка
          </span>
          {vehicle.rentalPerDay !== undefined && (
            <a
              href={`/kontakti?vehicle=${encodeURIComponent(fullLabel + " (под наем)")}`}
              className="flex items-center gap-2.5 transition-colors hover:text-fg"
            >
              <KeyRound className="size-4" strokeWidth={1.7} style={{ color: "var(--vg)" }} aria-hidden />
              Под наем от {formatNumber(vehicle.rentalPerDay)} €/ден
            </a>
          )}
        </div>
      </section>

      {/* ═══════════════  MARQUEE  ═══════════════ */}
      <div className="relative overflow-hidden border-b border-line bg-[#0a0c10] py-5 md:py-7">
        <Marquee
          text={`${vehicle.brand} ${vehicle.model}`}
          durationSec={34}
          className="text-stroke font-display text-[clamp(2.2rem,7vw,5.5rem)] font-extrabold uppercase leading-none tracking-tight"
        />
      </div>

      {/* ═══════════════  PERFORMANCE  ═══════════════ */}
      <section className="relative overflow-hidden bg-[#0c0f14] py-24 md:py-32">
        <Parallax distance={70} className="pointer-events-none absolute -right-4 top-6 select-none">
          <span className="text-stroke font-display text-[18vw] font-extrabold leading-none tracking-tight opacity-60">01</span>
        </Parallax>
        <div className="relative mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <FadeIn>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Перформанс</p>
                <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,4rem)] font-extrabold uppercase leading-[0.9] tracking-tight">
                  Технически
                  <br />
                  характеристики
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
                Ключови заводски стойности на този автомобил — мощност, динамика и характер.
              </p>
            </div>
          </FadeIn>
          <FadeIn>
            <SpecHighlights vehicle={vehicle} />
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════  DETAIL SHOWCASE (overflowing, layered)  ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c0f14] to-[#0e1217] py-20 md:py-32">
        <Parallax distance={90} className="pointer-events-none absolute -left-4 bottom-4 select-none">
          <span className="text-stroke font-display text-[16vw] font-extrabold uppercase leading-none tracking-tight opacity-50">
            {vehicle.bodyType || vehicle.model}
          </span>
        </Parallax>
        <div className="relative mx-auto grid max-w-wide items-center gap-10 px-4 md:px-8 lg:grid-cols-12 lg:gap-6 xl:px-12">
          <div className="relative z-10 lg:col-span-5">
            <FadeIn>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Детайл</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
                Създаден да
                <br />
                бъде забелязан
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-fg-muted">
                Всеки детайл е заснет в шоурума на AutoHaus — линии, материали и стойка,
                които личат отблизо. Разгледайте пълната галерия по-долу.
              </p>
            </FadeIn>
            {detailCallouts.length > 0 && (
              <div className="mt-9 flex flex-wrap gap-3">
                {detailCallouts.map((c, i) => (
                  <FadeIn key={c.label} delay={0.1 + i * 0.1}>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">{c.label}</p>
                      <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-2xl font-extrabold tracking-tight text-titanium-num">
                        {c.value}
                        <span className="text-xs font-medium text-fg-muted">{c.unit}</span>
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </div>

          {/* Big image — bleeds toward the right edge with parallax */}
          <div className="relative lg:col-span-7 lg:-mr-[6vw]">
            <Parallax distance={60}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-white/10 shadow-cinema md:aspect-[16/11]">
                <BlurImage
                  src={detailImage}
                  alt={`${fullLabel} — детайл`}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e1217]/40 to-transparent" />
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      {/* ═══════════════  GALLERY  ═══════════════ */}
      <section className="relative overflow-hidden bg-[#0e1217] py-20 md:py-28">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <FadeIn>
            <div className="mb-9 flex items-end justify-between gap-6">
              <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold uppercase leading-none tracking-tight">
                Галерия
              </h2>
              <span className="hidden text-sm text-fg-subtle sm:block">{vehicle.images.length} снимки</span>
            </div>
          </FadeIn>
          <FadeIn>
            <VehicleGallery images={vehicle.images} alt={fullLabel} power={vehicle.power} sizes="(min-width: 1280px) 1200px, 100vw" />
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════  ENGINE SOUND  ═══════════════ */}
      {vehicle.engineSound && (
        <section className="relative bg-[#0e1217] pb-20">
          <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
            <FadeIn>
              <div className="carbon edge-light relative overflow-hidden rounded-[1.4rem] border border-line-strong p-6 md:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, rgb(var(--va-glow)/0.28), transparent 68%)" }}
                />
                <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Сигнатура</p>
                    <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
                      Чуйте двигателя
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-fg-muted">
                      Истински запис на този автомобил — не симулация. Натиснете play.
                    </p>
                  </div>
                  <span className="rounded-full border border-line-strong px-3.5 py-2 text-xs text-fg-muted">
                    {vehicle.power} к.с.
                  </span>
                </div>
                <EngineSoundPlayer sound={vehicle.engineSound} accent title={fullLabel} subtitle="Истински запис" className="relative bg-black/40" />
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══════════════  EQUIPMENT + SPEC  ═══════════════ */}
      <section className="vd-field relative border-t border-line py-[4.6rem]">
        <div aria-hidden className="edge-light pointer-events-none absolute inset-x-0 top-0 h-px" />
        {highlights.length > 0 ? (
          <div
            id="equipment"
            className="mx-auto grid max-w-wide scroll-mt-28 gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14 xl:px-12"
          >
            <div>
              <FadeIn>
                <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold uppercase leading-none tracking-tight">
                  Оборудване
                </h2>
              </FadeIn>
              <FadeIn>
                <ul className="mt-8 grid grid-cols-1 gap-x-9 sm:grid-cols-2">
                  {highlights.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 border-b border-line py-[15px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      <span className="text-sm text-fg/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
            <div>
              <div className="lg:sticky lg:top-24">
                <FadeIn>
                  <div className="panel-metal edge-light overflow-hidden rounded-[1.25rem] p-6 md:p-7">
                    <h3 className="font-display text-xl font-bold tracking-tight text-fg">Пълна спецификация</h3>
                    <div className="mt-5">
                      <SpecTable vehicle={vehicle} />
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        ) : (
          <div id="equipment" className="mx-auto max-w-3xl scroll-mt-28 px-4 md:px-8 xl:px-12">
            <FadeIn>
              <div className="panel-metal edge-light overflow-hidden rounded-[1.25rem] p-6 md:p-8">
                <h3 className="font-display text-xl font-bold tracking-tight text-fg">Пълна спецификация</h3>
                <div className="mt-5">
                  <SpecTable vehicle={vehicle} />
                </div>
              </div>
            </FadeIn>
          </div>
        )}
      </section>

      {/* ═══════════════  PROVENANCE  ═══════════════ */}
      <section className="relative bg-gradient-to-b from-[#0f1217] to-[#0c0f14] py-20">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <VehicleProvenance vehicle={vehicle} />
        </div>
      </section>

      {/* ═══════════════  FINANCING  ═══════════════ */}
      {vehicle.price > 0 && (
        <section id="financing" className="relative scroll-mt-24 bg-[#0c0f14] pb-20">
          <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
            <FadeIn>
              <FinancingCalculator
                price={vehicle.price}
                annualRatePct={financing.annualRatePct}
                downPaymentPct={financing.downPaymentPct}
                termMonths={financing.termMonths}
              />
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══════════════  INQUIRY  ═══════════════ */}
      <section id="inquiry" className="vd-field relative scroll-mt-24 border-t border-line py-20">
        <div className="mx-auto grid max-w-wide gap-11 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:px-12">
          <div>
            <FadeIn>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Запитване</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
                Резервирайте
                <br />
                оглед.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-fg-muted">
                Оставете данните си и наш консултант ще се свърже с вас в рамките на работния ден за {fullLabel}.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mt-7 flex flex-col gap-4">
                <a href={telHref} className="flex items-center gap-3.5 text-sm text-fg-muted transition-colors hover:text-fg">
                  <span className="flex size-9 items-center justify-center rounded-[0.6rem] bg-accent/12 text-accent">
                    <Phone className="size-[17px]" strokeWidth={1.7} aria-hidden />
                  </span>
                  {phone}
                </a>
                {locationText && (
                  <span className="flex items-center gap-3.5 text-sm text-fg-muted">
                    <span className="flex size-9 items-center justify-center rounded-[0.6rem]" style={{ background: "rgb(var(--vg-glow)/0.12)", color: "var(--vg)" }}>
                      <MapPin className="size-[17px]" strokeWidth={1.7} aria-hidden />
                    </span>
                    {locationText}
                  </span>
                )}
              </div>
            </FadeIn>
          </div>
          <VehicleInquiryForm vehicleLabel={fullLabel} vehicleSlug={vehicle.slug} bare />
        </div>
      </section>

      {/* ═══════════════  SIMILAR  ═══════════════ */}
      {similar.length > 0 && (
        <section className="relative bg-[#0c0f14] pb-28 pt-4">
          <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
            <SimilarVehicles vehicles={similar} />
          </div>
        </section>
      )}

      <VehicleStickyBar vehicle={vehicle} phone={phone} />
    </article>
  );
}
