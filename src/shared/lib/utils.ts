import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 도파민 수지를 부호 포함 문자열로 포맷 (예: +1,000, -500, 0) */
export function formatDopamine(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString()}`;
}
