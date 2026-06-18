/** 前端格式化与状态映射工具 */
import type { VehicleStatus } from '@shared/types'

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  online: '在线',
  offline: '离线',
  transporting: '运输中',
}

export const STATUS_DOT: Record<VehicleStatus, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-slate-500',
  transporting: 'bg-sky-400',
}

export const STATUS_TEXT: Record<VehicleStatus, string> = {
  online: 'text-emerald-400',
  offline: 'text-slate-400',
  transporting: 'text-sky-400',
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatClock(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function formatTemp(t: number): string {
  return `${t > 0 ? '' : ''}${t.toFixed(1)}°C`
}

export type TempStatus = 'normal' | 'high' | 'low'

export function tempStatus(temp: number, min: number, max: number): TempStatus {
  if (temp > max) return 'high'
  if (temp < min) return 'low'
  return 'normal'
}

export const TEMP_STATUS_COLOR: Record<TempStatus, string> = {
  normal: 'text-emerald-400',
  high: 'text-red-400',
  low: 'text-amber-alert',
}

export const TEMP_STATUS_BG: Record<TempStatus, string> = {
  normal: 'bg-emerald-400',
  high: 'bg-red-500',
  low: 'bg-amber-alert',
}
