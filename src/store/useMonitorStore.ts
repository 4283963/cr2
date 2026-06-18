/**
 * 监控主界面状态管理(zustand)
 * 协调车辆列表、选中车辆、轨迹、多温区温度与告警。
 */
import { create } from 'zustand'
import { api } from '@/api/client'
import type {
  VehicleSummary,
  VehicleDetail,
  GpsPoint,
  TemperatureReading,
  TemperatureAlert,
} from '@shared/types'

interface MonitorState {
  vehicles: VehicleSummary[]
  selectedVehicleId: string | null
  vehicleDetail: VehicleDetail | null
  trajectory: GpsPoint[]
  readings: TemperatureReading[]
  alerts: TemperatureAlert[]
  activeIndex: number

  loadingVehicles: boolean
  loadingVehicle: boolean
  error: string | null

  loadVehicles: () => Promise<void>
  selectVehicle: (id: string) => Promise<void>
  setActiveIndex: (i: number) => void
  clearSelection: () => void
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  vehicles: [],
  selectedVehicleId: null,
  vehicleDetail: null,
  trajectory: [],
  readings: [],
  alerts: [],
  activeIndex: 0,

  loadingVehicles: false,
  loadingVehicle: false,
  error: null,

  async loadVehicles() {
    set({ loadingVehicles: true, error: null })
    try {
      const vehicles = await api.listVehicles()
      set({ vehicles, loadingVehicles: false })
      const current = get().selectedVehicleId
      if (!current && vehicles.length > 0) {
        await get().selectVehicle(vehicles[0].id)
      }
    } catch (e) {
      set({ loadingVehicles: false, error: (e as Error).message })
    }
  },

  async selectVehicle(id) {
    set({
      selectedVehicleId: id,
      loadingVehicle: true,
      error: null,
      trajectory: [],
      readings: [],
      alerts: [],
      activeIndex: 0,
    })
    try {
      const [detail, trajectory, readings, alerts] = await Promise.all([
        api.getVehicle(id),
        api.getTrajectory(id),
        api.getTemperatures(id),
        api.getAlerts(id),
      ])
      set({
        vehicleDetail: detail,
        trajectory,
        readings,
        alerts,
        activeIndex: Math.max(0, trajectory.length - 1),
        loadingVehicle: false,
      })
    } catch (e) {
      set({ loadingVehicle: false, error: (e as Error).message })
    }
  },

  setActiveIndex(i) {
    const max = get().trajectory.length - 1
    set({ activeIndex: Math.min(Math.max(0, i), max) })
  },

  clearSelection() {
    set({
      selectedVehicleId: null,
      vehicleDetail: null,
      trajectory: [],
      readings: [],
      alerts: [],
      activeIndex: 0,
    })
  },
}))

/** 选中节点:当前轨迹点 */
export function useActiveGpsPoint(): GpsPoint | null {
  const { trajectory, activeIndex } = useMonitorStore()
  return trajectory[activeIndex] ?? null
}

/** 当前时间戳下各温区的温度记录 */
export function useReadingsAtActive(): TemperatureReading[] {
  const { trajectory, activeIndex, readings } = useMonitorStore()
  const point = trajectory[activeIndex]
  if (!point) return []
  return readings.filter((r) => r.timestamp === point.timestamp)
}
