/**
 * 车辆基础信息服务
 * 将仓储记录映射为对外契约类型,并聚合温区数量与告警数。
 */
import type { VehicleSummary, VehicleDetail, TemperatureZone } from '@shared/types'
import { vehicleRepository } from './vehicle.repository.js'
import { temperatureRepository } from '../temperature/temperature.repository.js'
import type { VehicleRecord, ZoneRecord } from '../../store/store.js'

function toZone(z: ZoneRecord): TemperatureZone {
  return {
    id: z.id,
    vehicleId: z.vehicleId,
    name: z.name,
    minTemp: z.minTemp,
    maxTemp: z.maxTemp,
    sortOrder: z.sortOrder,
  }
}

function toSummary(v: VehicleRecord): VehicleSummary {
  const zones = vehicleRepository.findZonesByVehicleId(v.id)
  const activeAlertCount = temperatureRepository.countAlertsByVehicle(v.id)
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    model: v.model,
    capacityKg: v.capacityKg,
    status: v.status,
    zoneCount: zones.length,
    activeAlertCount,
  }
}

export const vehicleService = {
  listSummaries(): VehicleSummary[] {
    return vehicleRepository.findAllVehicles().map(toSummary)
  },

  getDetail(id: string): VehicleDetail | null {
    const v = vehicleRepository.findVehicleById(id)
    if (!v) return null
    const zones = vehicleRepository.findZonesByVehicleId(id)
    return {
      ...toSummary(v),
      zones: zones.map(toZone),
    }
  },
}
