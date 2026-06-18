/**
 * 车辆基础信息仓储
 * 提供车辆与温区配置的查询能力。
 */
import { getStore, type VehicleRecord, type ZoneRecord } from '../../store/store.js'

export const vehicleRepository = {
  findAllVehicles(): VehicleRecord[] {
    return getStore().vehicles
  },

  findVehicleById(id: string): VehicleRecord | null {
    return getStore().vehicles.find((v) => v.id === id) ?? null
  },

  findZonesByVehicleId(vehicleId: string): ZoneRecord[] {
    return getStore()
      .zones.filter((z) => z.vehicleId === vehicleId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },
}
