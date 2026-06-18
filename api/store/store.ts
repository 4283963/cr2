/**
 * 内存仓储(store)
 * 模拟数据库,启动时由 seed.ts 初始化。
 * 后续可平滑替换为 SQLite/Postgres,只需实现相同 Repository 接口。
 */
import type { VehicleStatus } from '@shared/types'

export interface VehicleRecord {
  id: string
  plateNumber: string
  model: string
  capacityKg: number
  status: VehicleStatus
}

export interface ZoneRecord {
  id: string
  vehicleId: string
  name: string
  minTemp: number
  maxTemp: number
  sortOrder: number
}

export interface GpsRecord {
  id: string
  vehicleId: string
  timestamp: string
  latitude: number
  longitude: number
  speed: number
  heading: number
}

export interface TemperatureRecord {
  id: string
  vehicleId: string
  zoneId: string
  timestamp: string
  temperature: number
}

export interface InMemoryStore {
  vehicles: VehicleRecord[]
  zones: ZoneRecord[]
  gpsPoints: GpsRecord[]
  temperatures: TemperatureRecord[]
}

const store: InMemoryStore = {
  vehicles: [],
  zones: [],
  gpsPoints: [],
  temperatures: [],
}

export function getStore(): InMemoryStore {
  return store
}

export function resetStore(): void {
  store.vehicles = []
  store.zones = []
  store.gpsPoints = []
  store.temperatures = []
}
