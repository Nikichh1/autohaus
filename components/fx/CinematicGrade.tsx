import { cn } from "@/lib/utils";

/**
 * Cinematic colour-grade overlay for the scroll-scrubbed film scenes (intro +
 * feature). A warm gold sheen with a faint cool counter (soft-light), a contrast
 * vignette, and subtle edge darkening — gives the footage a graded, "shot on
 * cinema glass" feel. Non-interactive; drop it over a canvas/video.
 */
export function CinematicGrade({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {/* cool steel sheen + deep shadow — the titanium "look" */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: 0.55,
          background:
            "linear-gradient(125deg, rgba(20,30,44,0.45) 0%, transparent 44%, rgba(178,192,208,0.5) 100%)",
        }}
      />
      {/* gentle bloom toward the steel highlight side */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          opacity: 0.12,
          background:
            "radial-gradient(60% 70% at 78% 38%, rgba(188,202,218,0.45), transparent 70%)",
        }}
      />
      {/* contrast vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 42%, transparent 52%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* cinematic edge darkening */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}
