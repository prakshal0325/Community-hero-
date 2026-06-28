import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCEPTED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  WORK_STARTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  AWAITING_VERIFICATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CLOSED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export const severityColors: Record<string, string> = {
  LOW: 'text-green-600 dark:text-green-400',
  MEDIUM: 'text-yellow-600 dark:text-yellow-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  CRITICAL: 'text-red-600 dark:text-red-400',
};

export const categoryIcons: Record<string, string> = {
  POTHOLE: '🕳️',
  GARBAGE: '🗑️',
  WATER_LEAKAGE: '💧',
  BROKEN_STREETLIGHT: '💡',
  SEWAGE_PROBLEM: '🚰',
  ROAD_DAMAGE: '🛣️',
  ILLEGAL_DUMPING: '🚯',
  TRAFFIC_SIGNAL_FAILURE: '🚦',
  FALLEN_TREE: '🌳',
  PUBLIC_PROPERTY_DAMAGE: '🏛️',
  OTHER: '📋',
};

export const categoryLabels: Record<string, string> = {
  POTHOLE: 'Pothole',
  GARBAGE: 'Garbage',
  WATER_LEAKAGE: 'Water Leakage',
  BROKEN_STREETLIGHT: 'Broken Streetlight',
  SEWAGE_PROBLEM: 'Sewage Problem',
  ROAD_DAMAGE: 'Road Damage',
  ILLEGAL_DUMPING: 'Illegal Dumping',
  TRAFFIC_SIGNAL_FAILURE: 'Traffic Signal Failure',
  FALLEN_TREE: 'Fallen Tree',
  PUBLIC_PROPERTY_DAMAGE: 'Public Property Damage',
  OTHER: 'Other',
};

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function calculateXPProgress(xp: number, level: number): number {
  const xpPerLevel = 500;
  const currentLevelXP = (level - 1) * xpPerLevel;
  const progress = ((xp - currentLevelXP) / xpPerLevel) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
