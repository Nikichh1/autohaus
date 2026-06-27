"use client";

import { useState } from "react";
import { Phone, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import type { Vehicle } from "@/types";
import { displayPrice } from "@/lib/utils";
import { contactInfo } from "@/lib/nav";

export function VehicleStickyBar({ vehicle }: { vehicle: Vehicle }) {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const threshold =
      typeof window !== "undefined" ? window.innerHeight * 0.9 : 800;
    setShow(y > threshold);
  });

  const label = `${vehicle.brand} ${vehicle.model}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="edge-light fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-base/80 backdrop-blur-2xl"
        >
          <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-4 py-3 md:px-8 xl:px-12">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">
                {label}
                {vehicle.variant && (
                  <span className="text-fg-muted"> · {vehicle.variant}</span>
                )}
              </p>
              <p className="font-display text-base font-semibold text-accent">
                {displayPrice(vehicle.price)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
              >
                <Phone className="size-4" />
                <span className="hidden sm:inline">Обади се</span>
              </a>
              <a
                href="#inquiry"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink transition-colors hover:bg-accent"
              >
                <CalendarCheck className="size-4" />
                Запази оглед
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
