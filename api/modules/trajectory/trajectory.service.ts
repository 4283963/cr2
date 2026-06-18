/**
 * GPS 轨迹服务
 * 将仓储轨迹点映射为对外契约类型 GpsPoint。
 */
import type { GpsPoint } from '@shared/types'
import { gpsRepository } from './trajectory.repository.js'

export const trajectoryService = {
  getTrajectory(vehicleId: string, date?: string): GpsPoint[] {
    return gpsRepository.findTrajectoryByVehicle(vehicleId, date).map((g) => ({
      id: g.id,
      vehicleId: g.vehicleId,
      timestamp: g.timestamp,
      latitude: g.latitude,
      longitude: g.longitude,
      speed: g.speed,
      heading: g.heading,
    }))
  },
}
