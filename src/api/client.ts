/**
 * 前端 API 客户端
 * 复用 shared 中的 API 端点常量与类型,保证前后端接口对齐。
 */
import { API, type ApiResponse } from '@shared/types'
import type {
  VehicleSummary,
  VehicleDetail,
  GpsPoint,
  TemperatureReading,
  TemperatureAlert,
} from '@shared/types'

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`请求失败 (${res.status})`)
  }
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.error ?? '未知错误')
  }
  return body.data
}

function withQuery(base: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v)
  }
  const s = qs.toString()
  return s ? `${base}?${s}` : base
}

export const api = {
  listVehicles(status?: string): Promise<VehicleSummary[]> {
    return request<VehicleSummary[]>(withQuery(API.VEHICLES, { status }))
  },
  getVehicle(id: string): Promise<VehicleDetail> {
    return request<VehicleDetail>(API.VEHICLE_DETAIL(id))
  },
  getTrajectory(id: string, date?: string): Promise<GpsPoint[]> {
    return request<GpsPoint[]>(withQuery(API.TRAJECTORY(id), { date }))
  },
  getTemperatures(id: string, date?: string): Promise<TemperatureReading[]> {
    return request<TemperatureReading[]>(withQuery(API.TEMPERATURES(id), { date }))
  },
  getAlerts(id: string, date?: string): Promise<TemperatureAlert[]> {
    return request<TemperatureAlert[]>(withQuery(API.ALERTS(id), { date }))
  },
}
