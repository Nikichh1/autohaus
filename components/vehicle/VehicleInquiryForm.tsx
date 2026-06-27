"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function VehicleInquiryForm({
  vehicleLabel,
  vehicleSlug,
}: {
  vehicleLabel: string;
  vehicleSlug?: string;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name")?.toString() ?? "",
      phone: fd.get("phone")?.toString() ?? "",
      email: fd.get("email")?.toString() ?? "",
      message: fd.get("message")?.toString() ?? "",
      vehicleSlug: vehicleSlug ?? "",
      vehicleLabel,
      source: "vehicle_inquiry",
      company: fd.get("company")?.toString() ?? "",
    };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Възникна грешка. Опитайте отново.");
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Възникна грешка. Опитайте отново.");
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="panel-glass edge-light flex flex-col items-start gap-4 rounded-[1.25rem] p-8 md:p-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-6" />
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-fg">
          Благодарим за запитването.
        </h3>
        <p className="max-w-md text-fg-muted">
          Наш консултант ще се свърже с вас относно {vehicleLabel} в рамките на работния ден.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-glass edge-light rounded-[1.25rem] p-6 md:p-10"
    >
      <p className="label-fine text-fg-subtle">Запитване</p>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
        Заявете оглед или попитайте за {vehicleLabel}
      </h3>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Input name="name" label="Име" placeholder="Вашето име" required />
        <Input name="phone" label="Телефон" type="tel" placeholder="+359 ..." required />
        <Input
          name="email"
          label="Имейл"
          type="email"
          placeholder="you@example.com"
          className="sm:col-span-2"
        />
        <Textarea
          name="message"
          label="Съобщение"
          placeholder="Интересувам се от оглед и тест драйв..."
          className="sm:col-span-2"
          defaultValue={`Здравейте, интересувам се от ${vehicleLabel}.`}
        />
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" variant="solid" arrow disabled={sending}>
          {sending ? "Изпращане…" : "Изпрати запитване"}
        </Button>
        <p className="text-xs text-fg-subtle">
          С изпращането се съгласявате с обработката на личните ви данни.
        </p>
      </div>
    </form>
  );
}
