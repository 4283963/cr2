/**
 * 多温区温度服务
 * - 将温度记录映射为 TemperatureReading(含 isAlert 计算)
 * - 生成 TemperatureAlert(越限事件,带轨迹坐标用于地图标记)
 */
import type { TemperatureReading, TemperatureAlert } from '@shared/types'
import { temperatureRepository } from './temperature.repository.js'
import { vehicleRepository } from '../vehicle/vehicle.repository.js'
import { gpsRepository } from '../trajectory/trajectory.repository.js'
import type { ZoneRecord, GpsRecord } from '../../store/store.js'

function nearestGps(gps: GpsRecord[], ts: string): GpsRecord | null {
  const t = new Date(ts).getTime()
  let best: GpsRecord | null = null
  let bestDiff = Infinity
  for (const g of gps) {
    const diff = Math.abs(new Date(g.timestamp).getTime() - t)
    if (diff < bestDiff) {
      bestDiff = diff
      best = g
    }
  }
  return best
}

export const temperatureService = {
  getReadings(vehicleId: string, date?: string): TemperatureReading[] {
    const zones = new Map<string, ZoneRecord>(
      vehicleRepository.findZonesByVehicleId(vehicleId).map((z) => [z.id, z]),
    )
    return temperatureRepository.findReadingsByVehicle(vehicleId, date).map((t) => {
      const zone = zones.get(t.zoneId)
      const minTemp = zone?.minTemp ?? 0
      const maxTemp = zone?.maxTemp ?? 0
      const isAlert = t.temperature < minTemp || t.temperature > maxTemp
      return {
        id: t.id,
        vehicleId: t.vehicleId,
        zoneId: t.zoneId,
        zoneName: zone?.name ?? '未知温区',
        timestamp: t.timestamp,
        temperature: t.temperature,
        minTemp,
        maxTemp,
        isAlert,
      }
    })
  },

  getAlerts(vehicleId: string, date?: string): TemperatureAlert[] {
    const zones = new Map<string, ZoneRecord>(
      vehicleRepository.findZonesByVehicleId(vehicleId).map((z) => [z.id, z]),
    )
    const gps = gpsRepository.findTrajectoryByVehicle(vehicleId, date)
    const gpsByTime = new Map<string, GpsRecord>(gps.map((g) => [g.timestamp, g]))

    const alerts: TemperatureAlert[] = []
    for (const t of temperatureRepository.findReadingsByVehicle(vehicleId, date)) {
      const zone = zones.get(t.zoneId)
      if (!zone) continue
      const isHigh = t.temperature > zone.maxTemp
      const isLow = t.temperature < zone.minTemp
      if (!isHigh && !isLow) continue

      const gpsPoint = gpsByTime.get(t.timestamp) ?? nearestGps(gps, t.timestamp)
      if (!gpsPoint) continue

      alerts.push({
        id: t.id,
        vehicleId: t.vehicleId,
        zoneId: t.zoneId,
        zoneName: zone.name,
        timestamp: t.timestamp,
        temperature: t.temperature,
        minTemp: zone.minTemp,
        maxTemp: zone.maxTemp,
        direction: isHigh ? 'high' : 'low',
        deviation: Math.abs(
          t.temperature - (isHigh ? zone.maxTemp : zone.minTemp),
        ),
        latitude: gpsPoint.latitude,
        longitude: gpsPoint.longitude,
      })
    }
    return alerts
  },
}
