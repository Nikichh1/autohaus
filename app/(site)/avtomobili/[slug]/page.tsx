import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ShieldCheck, KeyRound, MapPin, Phone, Play } from "lucide-react";
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
import { VehicleGalleryMosaic } from "@/components/vehicle/VehicleGalleryMosaic";
import { SpecTable } from "@/components/vehicle/SpecTable";
import { FinancingCalculator } from "@/components/vehicle/FinancingCalculator";
import { VehicleInquiryForm } from "@/components/vehicle/VehicleInquiryForm";
import { VehicleStickyBar } from "@/components/vehicle/VehicleStickyBar";
import { VehicleProvenance } from "@/components/vehicle/VehicleProvenance";
import { SimilarVehicles } from "@/components/vehicle/SimilarVehicles";
import { EngineSoundPlayer } from "@/components/vehicle/EngineSoundPlayer";
import { TrackView } from "@/components/vehicle/TrackView";
import { FadeIn } from "@/components/motion/FadeIn";
import { StatCounter } from "@/components/motion/StatCounter";
import { BlurImage } from "@/components/motion/BlurImage";

export const dynamic = "force-dynamic";

const BASE_URL = "https://autohaus.bg";

type PageProps = { params: Promise<{ slug: string }> };

function absUrl(path: string): string {
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

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

function metaDescription(v: Vehicle, fullLabel: string): string {
  const base = v.description?.trim();
  if (base) return base.slice(0, 160);
  return `${fullLabel} — ${vehicleSummary(v)}. Проверена история и писмена гаранция от AutoHaus, Пловдив.`.slice(0, 160);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};

  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, title);
  const canonical = `/avtomobili/${vehicle.slug}/`;
  const images = vehicle.images.slice(0, 4).map((url) => ({ url: absUrl(url), alt: title }));

  return {
    title,
    description,
    keywords: [vehicle.brand, vehicle.model, vehicle.variant, vehicle.bodyType, "автомобил", "продажба", "лизинг", "Пловдив"].filter(
      (k): k is string => Boolean(k),
    ),
    alternates: { canonical },
    openGraph: { type: "website", title: `${title} · AutoHaus`, description, url: canonical, images: images.length ? images : undefined },
    twitter: { card: "summary_large_image", title: `${title} · AutoHaus`, description, images: images.map((i) => i.url) },
  };
}

function indicativeMonthly(price: number, f: FinancingSettings): number {
  if (price <= 0) return 0;
  const financed = price * (1 - f.downPaymentPct / 100);
  if (financed <= 0) return 0;
  const r = f.annualRatePct / 100 / 12;
  const n = f.termMonths;
  if (r <= 0) return Math.round(financed / n);
  return Math.round((financed * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
}

function buildJsonLd(
  vehicle: Vehicle,
  fullLabel: string,
  description: string,
  contact: { company: string; phone: string; street: string; city: string; postcode: string; country: string },
) {
  const canonicalUrl = absUrl(`/avtomobili/${vehicle.slug}/`);
  const engine: Record<string, unknown> = { "@type": "EngineSpecification" };
  if (vehicle.power) engine.enginePower = { "@type": "QuantitativeValue", value: vehicle.power, unitText: "к.с." };
  if (vehicle.torque) engine.torque = { "@type": "QuantitativeValue", value: vehicle.torque, unitText: "Nm" };
  if (vehicle.engineCC) engine.engineDisplacement = { "@type": "QuantitativeValue", value: vehicle.engineCC, unitCode: "CMQ" };

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
    ...(vehicle.topSpeed ? { speed: { "@type": "QuantitativeValue", value: vehicle.topSpeed, unitCode: "KMH" } } : {}),
    ...(vehicle.acceleration ? { accelerationTime: { "@type": "QuantitativeValue", value: vehicle.acceleration, unitCode: "SEC" } } : {}),
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
  const coll = collections.find((c) => c.slug === vehicle.collection);
  const aboutHeadline = coll?.tagline ?? "Създаден да изпъква.";
  const detailImage = vehicle.images[1] ?? vehicle.images[0];

  const aboutStats = [
    { to: vehicle.power, unit: "к.с.", label: "Мощност", decimals: 0 },
    vehicle.acceleration ? { to: vehicle.acceleration, unit: "сек", label: "0–100 км/ч", decimals: 1 } : null,
    vehicle.topSpeed ? { to: vehicle.topSpeed, unit: "км/ч", label: "Макс. скорост", decimals: 0 } : null,
    vehicle.torque ? { to: vehicle.torque, unit: "Nm", label: "Въртящ момент", decimals: 0 } : null,
  ].filter(Boolean).slice(0, 4) as Array<{ to: number; unit: string; label: string; decimals: number }>;

  const highlights = vehicle.features;
  const descText = vehicle.description?.trim() || `${fullLabel} — ${vehicleSummary(vehicle)}.`;

  return (
    <article className="vehicle-detail text-fg">
      <TrackView slug={vehicle.slug} />
      <ProductLoader slug={vehicle.slug} brand={vehicle.brand} model={vehicle.model} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ═══════════  HERO (dark card on cream)  ═══════════ */}
      <CinematicHero vehicle={vehicle} monthly={monthly} collLabel={coll?.label ?? ""} />

      {/* ═══════════  ABOUT (light)  ═══════════ */}
      <section className="bg-base py-20 md:py-28">
        <div className="mx-auto grid max-w-wide gap-x-16 gap-y-14 px-4 md:px-8 lg:grid-cols-2 xl:px-12">
          {/* left — media + assurance */}
          <FadeIn>
            <a href="#galeriya" className="vd-card vd-card-hover group block overflow-hidden rounded-[1.5rem]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <BlurImage src={detailImage} alt={`${fullLabel} — детайл`} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
                {vehicle.engineSound && (
                  <span className="absolute bottom-4 left-4 flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-lg">
                    <Play className="size-5 translate-x-0.5 fill-current" aria-hidden />
                  </span>
                )}
              </div>
            </a>
            <div className="mt-7 flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--vg-glow)/0.12)", color: "var(--vg)" }}>
                <ShieldCheck className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <p className="font-display text-base font-bold tracking-tight text-fg">Сертифицирано състояние</p>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-fg-muted">
                  Проверена история, пълна документация и писмена гаранция към всеки автомобил.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* right — about copy + stat cards */}
          <div className="flex flex-col justify-center">
            <FadeIn>
              <span className="vd-eyebrow">[ За автомобила ]</span>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold uppercase leading-[0.98] tracking-tight text-fg">
                {aboutHeadline}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">{descText}</p>
            </FadeIn>
            {aboutStats.length > 0 && (
              <FadeIn delay={0.1}>
                <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {aboutStats.map((s) => (
                    <div key={s.label} className="vd-card rounded-2xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">{s.label}</p>
                      <p className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-fg">
                        <StatCounter to={s.to} decimals={s.decimals} />
                        <span className="ml-1 text-xs font-medium text-fg-muted">{s.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════  GALLERY (light bento)  ═══════════ */}
      <section id="galeriya" className="scroll-mt-24 bg-elevated py-20 md:py-28">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <FadeIn>
            <div className="mb-9 flex items-end justify-between gap-6">
              <div>
                <span className="vd-eyebrow">[ Галерия ]</span>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold uppercase leading-none tracking-tight text-fg">
                  Всеки ъгъл
                </h2>
              </div>
              <span className="hidden text-sm text-fg-subtle sm:block">{vehicle.images.length} снимки</span>
            </div>
          </FadeIn>
          <VehicleGalleryMosaic images={vehicle.images} alt={fullLabel} />
        </div>
      </section>

      {/* ═══════════  ENGINE SOUND (dark island)  ═══════════ */}
      {vehicle.engineSound && (
        <section id="zvuk" className="scroll-mt-24 bg-base py-8 md:py-12">
          <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
            <FadeIn>
              <div className="vd-dark carbon edge-light relative overflow-hidden rounded-[1.6rem] border border-line-strong p-6 md:p-10">
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgb(var(--va-glow)/0.30), transparent 68%)" }} />
                <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="vd-eyebrow text-accent">[ Сигнатура ]</span>
                    <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-fg md:text-4xl">Чуйте двигателя</h2>
                    <p className="mt-2 max-w-md text-sm text-fg-muted">Истински запис на този автомобил — не симулация. Натиснете play.</p>
                  </div>
                  <span className="rounded-full border border-line-strong px-3.5 py-2 text-xs text-fg-muted">{vehicle.power} к.с.</span>
                </div>
                <EngineSoundPlayer sound={vehicle.engineSound} accent title={fullLabel} subtitle="Истински запис" className="relative bg-black/40" />
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══════════  EQUIPMENT + SPEC (light)  ═══════════ */}
      <section id="equipment" className="scroll-mt-24 bg-base py-20 md:py-28">
        <div className="mx-auto grid max-w-wide gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16 xl:px-12">
          {highlights.length > 0 ? (
            <div>
              <FadeIn>
                <span className="vd-eyebrow">[ Оборудване ]</span>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold uppercase leading-none tracking-tight text-fg">
                  Детайлите
                </h2>
              </FadeIn>
              <FadeIn>
                <ul className="mt-8 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  {highlights.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 border-b border-line py-[15px]">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.4} aria-hidden />
                      <span className="text-sm text-fg">{feature}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          ) : (
            <div>
              <FadeIn>
                <span className="vd-eyebrow">[ Спецификация ]</span>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.2rem)] font-extrabold uppercase leading-none tracking-tight text-fg">
                  Технически данни
                </h2>
              </FadeIn>
            </div>
          )}
          <div>
            <div className="lg:sticky lg:top-24">
              <FadeIn>
                <div className="vd-card rounded-[1.5rem] p-6 md:p-7">
                  <h3 className="font-display text-lg font-bold tracking-tight text-fg">Пълна спецификация</h3>
                  <div className="mt-5">
                    <SpecTable vehicle={vehicle} />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════  PROVENANCE (light)  ═══════════ */}
      <section className="bg-elevated py-20 md:py-28">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <VehicleProvenance vehicle={vehicle} />
        </div>
      </section>

      {/* ═══════════  FINANCING (dark island)  ═══════════ */}
      {vehicle.price > 0 && (
        <section id="financing" className="scroll-mt-24 bg-base py-12 md:py-20">
          <div className="vd-dark mx-auto max-w-wide px-4 md:px-8 xl:px-12">
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

      {/* ═══════════  INQUIRY (light)  ═══════════ */}
      <section id="inquiry" className="scroll-mt-24 bg-base pb-24 pt-8 md:pb-32">
        <div className="mx-auto grid max-w-wide gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:px-12">
          <div>
            <FadeIn>
              <span className="vd-eyebrow">[ Запитване ]</span>
              <h2 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold uppercase leading-[0.96] tracking-tight text-fg">
                Резервирайте
                <br />
                оглед
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-fg-muted">
                Оставете данните си и наш консултант ще се свърже с вас в рамките на работния ден за {fullLabel}.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="mt-8 flex flex-col gap-4">
                <a href={telHref} className="flex items-center gap-3.5 text-sm text-fg transition-colors hover:text-accent">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Phone className="size-[18px]" strokeWidth={1.7} aria-hidden />
                  </span>
                  {phone}
                </a>
                {locationText && (
                  <span className="flex items-center gap-3.5 text-sm text-fg">
                    <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: "rgb(var(--vg-glow)/0.12)", color: "var(--vg)" }}>
                      <MapPin className="size-[18px]" strokeWidth={1.7} aria-hidden />
                    </span>
                    {locationText}
                  </span>
                )}
                {vehicle.rentalPerDay !== undefined && (
                  <a href={`/kontakti?vehicle=${encodeURIComponent(fullLabel + " (под наем)")}`} className="flex items-center gap-3.5 text-sm text-fg transition-colors hover:text-accent">
                    <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: "rgb(var(--vg-glow)/0.12)", color: "var(--vg)" }}>
                      <KeyRound className="size-[18px]" strokeWidth={1.7} aria-hidden />
                    </span>
                    Под наем от {formatNumber(vehicle.rentalPerDay)} €/ден
                  </a>
                )}
              </div>
            </FadeIn>
          </div>
          <VehicleInquiryForm vehicleLabel={fullLabel} vehicleSlug={vehicle.slug} bare />
        </div>
      </section>

      {/* ═══════════  SIMILAR (light)  ═══════════ */}
      {similar.length > 0 && (
        <section className="bg-elevated py-20 md:py-28">
          <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
            <SimilarVehicles vehicles={similar} />
          </div>
        </section>
      )}

      <VehicleStickyBar vehicle={vehicle} phone={phone} />
    </article>
  );
}
