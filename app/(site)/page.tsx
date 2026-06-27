import { IntroVideoScroll } from "@/components/home/IntroVideoScroll";
import { HomeHero } from "@/components/sections/HomeHero";
import { Manifesto } from "@/components/home/Manifesto";
import { Collection } from "@/components/home/Collection";
import { FeatureScene } from "@/components/home/FeatureScene";
import { ConciergeScene } from "@/components/home/ConciergeScene";
import { StandardScene } from "@/components/home/StandardScene";
import { HouseScene } from "@/components/home/HouseScene";
import type { Metadata } from "next";
import { FinaleScene } from "@/components/home/FinaleScene";
import { getFeaturedVehicles, getAllPublicVehicles } from "@/lib/data/vehicles";
import { getContent } from "@/lib/cms/read";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getContent();
  return {
    title: { absolute: cms["home.seo.title"] },
    description: cms["home.seo.description"],
  };
}

/**
 * The homepage is a single cinematic scroll — a film, not a stack of blocks.
 * Intro → Hero (the car) → Manifesto → The Collection → The Machine →
 * Concierge sourcing/import → The Standard (why us) → The House → Finale.
 * Every section earns its place: trust, luxury, or conversion. Symmetric
 * dark/light rhythm (D,D,L,L,D · D,L,L,D) with controlled cinematic beats.
 */
export default async function HomePage() {
  const cms = await getContent();
  const all = await getAllPublicVehicles();
  const featuredOnly = await getFeaturedVehicles();
  // Fall back to the newest inventory if nothing is explicitly featured yet.
  const featured = (featuredOnly.length ? featuredOnly : all).slice(0, 6);

  const featuredIds = new Set(featured.map((v) => v.id));
  const ghosts = [...all.filter((v) => !featuredIds.has(v.id)), ...featured]
    .slice(0, 6)
    .map((v) => ({ id: v.id, image: v.images[0] ?? "", label: `${v.brand} ${v.model}` }));

  return (
    <div className="bg-[#eceef1]">
      <IntroVideoScroll />
      <HomeHero
        content={{
          eyebrow: cms["home.hero.eyebrow"],
          headline: cms["home.hero.headline"],
          subcopy: cms["home.hero.subcopy"],
          ctaPrimary: cms["home.hero.ctaPrimary"],
          ctaSecondary: cms["home.hero.ctaSecondary"],
        }}
      />
      <Manifesto />
      <Collection vehicles={featured} ghosts={ghosts} total={all.length} />
      <FeatureScene />
      <ConciergeScene />
      <StandardScene />
      <HouseScene />
      <FinaleScene />
    </div>
  );
}
