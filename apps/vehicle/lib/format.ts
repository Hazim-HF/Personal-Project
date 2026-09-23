import type { ServiceCategory, ServiceRecord, Vehicle, VehicleType } from "@/lib/api";

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "CAR", label: "Car" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "OTHER", label: "Other" },
];

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: "OIL_CHANGE", label: "Oil Change", icon: "🛢️" },
  { value: "TIRES", label: "Tires", icon: "🛞" },
  { value: "BRAKES", label: "Brakes", icon: "🛑" },
  { value: "BATTERY", label: "Battery", icon: "🔋" },
  { value: "INSPECTION", label: "Inspection", icon: "📋" },
  { value: "REPAIR", label: "Repair", icon: "🔧" },
  { value: "OTHER", label: "Other", icon: "🧰" },
];

export function categoryMeta(category: ServiceCategory) {
  return SERVICE_CATEGORIES.find((c) => c.value === category) ?? SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];
}

export function vehicleTypeLabel(type: VehicleType) {
  return VEHICLE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMileage(km: number) {
  return `${km.toLocaleString("en-MY")} km`;
}

// How soon a reminder counts as "due soon".
const DUE_SOON_DAYS = 30;
const DUE_SOON_KM = 1000;

export type Reminder = {
  record: ServiceRecord;
  vehicle: Vehicle;
  overdue: boolean;
  dueSoon: boolean;
};

// The latest record per vehicle + category decides what's next; older records
// in the same category have been superseded.
export function upcomingReminders(records: ServiceRecord[], vehicles: Vehicle[]): Reminder[] {
  const latest = new Map<string, ServiceRecord>();
  for (const record of records) {
    const key = `${record.vehicleId}:${record.category}`;
    const current = latest.get(key);
    if (!current || new Date(record.date) > new Date(current.date)) latest.set(key, record);
  }

  const now = Date.now();
  const reminders: Reminder[] = [];

  for (const record of latest.values()) {
    if (!record.nextDueDate && record.nextDueMileage === null) continue;
    const vehicle = vehicles.find((v) => v.id === record.vehicleId);
    if (!vehicle) continue;

    const daysLeft = record.nextDueDate
      ? (new Date(record.nextDueDate).getTime() - now) / 86_400_000
      : Infinity;
    const kmLeft = record.nextDueMileage !== null ? record.nextDueMileage - vehicle.mileage : Infinity;

    reminders.push({
      record,
      vehicle,
      overdue: daysLeft < 0 || kmLeft < 0,
      dueSoon: daysLeft <= DUE_SOON_DAYS || kmLeft <= DUE_SOON_KM,
    });
  }

  return reminders.sort((a, b) => Number(b.overdue) - Number(a.overdue) || Number(b.dueSoon) - Number(a.dueSoon));
}

export function describeDue(reminder: Reminder) {
  const parts: string[] = [];
  if (reminder.record.nextDueDate) parts.push(formatDate(reminder.record.nextDueDate));
  if (reminder.record.nextDueMileage !== null) parts.push(`at ${formatMileage(reminder.record.nextDueMileage)}`);
  return `${reminder.overdue ? "Overdue" : "Due"} ${parts.join(" or ")}`;
}
