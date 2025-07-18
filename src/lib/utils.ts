import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0
  return ((revenue - cost) / cost) * 100
}

export function calculateCPM(cost: number, impressions: number): number {
  if (impressions === 0) return 0
  return (cost / impressions) * 1000
}

export function calculateCPV(cost: number, views: number): number {
  if (views === 0) return 0
  return cost / views
}

export function calculateEngagementRate(engagements: number, impressions: number): number {
  if (impressions === 0) return 0
  return (engagements / impressions) * 100
}