const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body.message || "Something went wrong", res.status);
  }

  return body as T;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "VAN" | "OTHER";

export type Vehicle = {
  id: string;
  name: string;
  type: VehicleType;
  make: string | null;
  model: string | null;
  year: number | null;
  plateNumber: string | null;
  mileage: number;
};

export type ServiceCategory = "OIL_CHANGE" | "TIRES" | "BRAKES" | "BATTERY" | "INSPECTION" | "REPAIR" | "OTHER";

export type ServiceRecord = {
  id: string;
  vehicleId: string;
  category: ServiceCategory;
  title: string;
  date: string;
  mileage: number;
  cost: string;
  workshop: string | null;
  notes: string | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
  vehicle: { id: string; name: string; plateNumber: string | null };
};

export function getMe() {
  return apiFetch<{ user: User }>("/api/me");
}

export function login(email: string, password: string) {
  return apiFetch<{ user: User }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ user: User }>("/api/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function logout() {
  return apiFetch<{ message: string }>("/api/logout", { method: "POST" });
}

export function getVehicles() {
  return apiFetch<{ vehicles: Vehicle[] }>("/api/vehicles");
}

export type NewVehicleInput = {
  name: string;
  type: VehicleType;
  make?: string;
  model?: string;
  year?: string;
  plateNumber?: string;
  mileage?: string;
};

export function createVehicle(input: NewVehicleInput) {
  return apiFetch<{ vehicle: Vehicle }>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getServiceRecords() {
  return apiFetch<{ serviceRecords: ServiceRecord[] }>("/api/service-records");
}

export type NewServiceRecordInput = {
  vehicleId: string;
  category: ServiceCategory;
  title: string;
  date: string;
  mileage: string;
  cost?: string;
  workshop?: string;
  notes?: string;
  nextDueDate?: string;
  nextDueMileage?: string;
};

export function createServiceRecord(input: NewServiceRecordInput) {
  return apiFetch<{ serviceRecord: ServiceRecord }>("/api/service-records", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
