"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPriceEUR } from "@/lib/utils";

// TODO: confirm real indicative interest rate with finance partner
const ANNUAL_RATE = 0.069;
const TERMS = [12, 24, 36, 48, 60, 72, 84];

export function FinancingCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [term, setTerm] = useState(60);

  const { down, financed, monthly } = useMemo(() => {
    const down = Math.round((price * downPct) / 100);
    const financed = price - down;
    const r = ANNUAL_RATE / 12;
    const n = term;
    const monthly =
      financed > 0
        ? (financed * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
        : 0;
    return { down, financed, monthly: Math.round(monthly) };
  }, [price, downPct, term]);

  return (
    <div className="panel-metal edge-light rounded-[1.25rem] p-6 md:p-10">
      <p className="label-fine text-fg-subtle">Калкулатор лизинг</p>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
        Ориентировъчна месечна вноска
      </h3>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          {/* Down payment */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="down" className="text-sm text-fg-muted">
                Първоначална вноска
              </label>
              <span className="text-sm font-medium text-fg">
                {downPct}% · {formatPriceEUR(down)}
              </span>
            </div>
            <input
              id="down"
              type="range"
              min={0}
              max={60}
              step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="mt-4 w-full accent-[var(--color-accent)]"
            />
          </div>

          {/* Term */}
          <div>
            <label htmlFor="term" className="text-sm text-fg-muted">
              Срок (месеци)
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  className={
                    "rounded-full border px-4 py-2 text-sm transition-colors " +
                    (term === t
                      ? "border-accent bg-accent text-ink"
                      : "border-line-strong text-fg-muted hover:border-accent hover:text-fg")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-between rounded-xl border border-line-strong bg-gradient-to-b from-[#191c22] to-[#0f1216] p-6">
          <div>
            <p className="label-fine text-fg-subtle">Месечна вноска от</p>
            <p className="mt-2 font-display text-display-2xs font-extrabold tabular-nums text-titanium">
              {formatPriceEUR(monthly)}
            </p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Финансирана сума</dt>
                <dd className="text-fg">{formatPriceEUR(financed)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Лихва (год.)</dt>
                <dd className="text-fg">{(ANNUAL_RATE * 100).toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
          <Link
            href="/lizing"
            className="group mt-6 inline-flex items-center gap-2 text-sm text-fg transition-colors hover:text-accent"
          >
            Пълно лизингово запитване
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-fg-subtle">
        * Изчислението е ориентировъчно и не представлява обвързваща оферта. Точните условия се определят индивидуално.
      </p>
    </div>
  );
}
