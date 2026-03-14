import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel_type: string;
  image_url: string;
  description: string;
  user_id: string;
  created_at: string;
  // New fields from legacy data
  color?: string;
  phone?: string;
  engine?: string;
  plate_last_digit?: string;
  plate_city?: string;
  soat_until?: string;
  techno_until?: string;
  whatsapp?: string;
  plate?: string;
  legacy_id?: number;
}
