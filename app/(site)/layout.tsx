import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PageTransition } from "@/components/transition/PageTransition";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { Grain } from "@/components/fx/Grain";

export const dynamic = "force-dynamic";

/**
 * Public marketing-site chrome. Everything that used to live in the root layout
 * now lives here so it applies only to public routes, never to /admin.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <SmoothScroll>
        <PageTransition>
          <Nav />
          <main className="overflow-x-clip">{children}</main>
          <Footer />
        </PageTransition>
      </SmoothScroll>
      <Grain />
    </>
  );
}
