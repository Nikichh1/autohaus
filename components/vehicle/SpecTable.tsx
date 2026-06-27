import type { Vehicle } from "@/types";
import { formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";

export function SpecTable({ vehicle }: { vehicle: Vehicle }) {
  const rows: Array<[string, string | number | undefined]> = [
    ["Година", vehicle.year],
    ["Пробег", `${formatNumber(vehicle.mileage)} км`],
    ["Двигател", vehicle.engineCC ? `${formatNumber(vehicle.engineCC)} см³` : undefined],
    ["Мощност", `${vehicle.power} к.с.`],
    ["Въртящ момент", vehicle.torque ? `${vehicle.torque} Nm` : undefined],
    ["0–100 км/ч", vehicle.acceleration ? `${vehicle.acceleration} с` : undefined],
    ["Макс. скорост", vehicle.topSpeed ? `${vehicle.topSpeed} км/ч` : undefined],
    ["Гориво", fuelLabels[vehicle.fuelType]],
    ["Трансмисия", transmissionLabels[vehicle.transmission]],
    ["Задвижване", drivetrainLabels[vehicle.drivetrain]],
    ["Тип каросерия", vehicle.bodyType],
    ["Врати", vehicle.doors],
    ["Места", vehicle.seats],
    ["Цвят екстериор", vehicle.exteriorColor],
    ["Цвят интериор", vehicle.interiorColor],
    ["VIN", vehicle.vin],
  ];

  const visible = rows.filter(([, value]) => value !== undefined && value !== "");

  return (
    <dl className="grid grid-cols-1">
      {visible.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-line py-3.5 transition-colors last:border-0 hover:bg-white/[0.02]"
        >
          <dt className="text-sm text-fg-muted">{label}</dt>
          <dd className="text-right text-sm font-medium tabular-nums text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
