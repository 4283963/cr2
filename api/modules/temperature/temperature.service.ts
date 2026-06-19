/**
 * 多温区温度服务
 * - 将温度记录映射为 TemperatureReading(含 isAlert 计算)
 * - 生成 TemperatureAlert(越限事件,带轨迹坐标用于地图标记)
 * - 生成 TemperatureSpike(骤变事件:1 分钟内变化超过阈值)
 */
import type {
  TemperatureReading,
  TemperatureAlert,
  TemperatureSpike,
} from '@shared/types'
import { temperatureRepository } from './temperature.repository.js'
import { vehicleRepository } from '../vehicle/vehicle.repository.js'
import { gpsRepository } from '../trajectory/trajectory.repository.js'
import type { ZoneRecord, GpsRecord } from '../../store/store.js'

const SPIKE_THRESHOLD_PER_MINUTE = 5 // ℃ / 分钟
const SPIKE_MAX_WINDOW_MS = 10 * 60 * 1000 // 最多检查 10 分钟内的点间隔

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

  /**
   * 检测温度骤变事件:短时间内温度变化速率超过阈值。
   *
   * 算法:对每个温区,按时间排序后检查每对相邻点的变化率:
   *   速率(℃/分钟) = 温度差 / 时间差(分钟)
   * 如果 |速率| >= 5℃/分钟 且 两点时间差 <= 10 分钟,则标记为骤变。
   *
   * 这样设计的原因:实际 IoT 采样间隔可能不固定(如 3 分钟/次),
   * 1 分钟窗口内可能只有 1 个点。用"变化率"更符合业务语义。
   * 同一窗口内的连续多个骤变只报告变化最大的那个,避免刷屏。
   */
  getSpikes(vehicleId: string, date?: string): TemperatureSpike[] {
    const zones = new Map<string, ZoneRecord>(
      vehicleRepository.findZonesByVehicleId(vehicleId).map((z) => [z.id, z]),
    )
    const gps = gpsRepository.findTrajectoryByVehicle(vehicleId, date)
    const gpsByTime = new Map<string, GpsRecord>(gps.map((g) => [g.timestamp, g]))

    const allReadings = temperatureRepository.findReadingsByVehicle(vehicleId, date)

    // 按温区分组
    const byZone = new Map<string, typeof allReadings>()
    for (const r of allReadings) {
      const arr = byZone.get(r.zoneId) ?? []
      arr.push(r)
      byZone.set(r.zoneId, arr)
    }

    const spikes: TemperatureSpike[] = []
    const lastReportedByZone = new Map<string, number>()

    for (const [zoneId, readings] of byZone) {
      const zone = zones.get(zoneId)
      if (!zone) continue

      const sorted = readings
        .map((r) => ({ ...r, ts: new Date(r.timestamp).getTime() }))
        .sort((a, b) => a.ts - b.ts)

      if (sorted.length < 2) continue

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        const deltaT = (curr.ts - prev.ts) / 1000 // 秒

        // 间隔太长,不认为是"骤变"
        if (deltaT <= 0 || deltaT * 1000 > SPIKE_MAX_WINDOW_MS) continue

        const delta = curr.temperature - prev.temperature
        const ratePerMin = Math.abs(delta) / (deltaT / 60)

        if (ratePerMin < SPIKE_THRESHOLD_PER_MINUTE) continue

        const direction: 'rising' | 'falling' = delta > 0 ? 'rising' : 'falling'
        const gpsPoint =
          gpsByTime.get(curr.timestamp) ?? nearestGps(gps, curr.timestamp)
        if (!gpsPoint) continue

        // 去重:如果 5 分钟内已报告过同温区的骤变,
        // 只保留变化率更大的那个,避免同一事件的上升/回落都被标记
        const lastTs = lastReportedByZone.get(zoneId) ?? -Infinity
        if (curr.ts - lastTs < 5 * 60 * 1000) {
          // 找到上一个报告的,如果当前变化率更大,则替换
          const existingIdx = spikes.findIndex(
            (s) =>
              s.zoneId === zoneId &&
              curr.ts - new Date(s.timestamp).getTime() < 5 * 60 * 1000,
          )
          if (existingIdx >= 0) {
            const existing = spikes[existingIdx]
            const existingRate = existing.deltaAbs / (existing.windowSeconds / 60)
            if (ratePerMin > existingRate) {
              spikes[existingIdx] = {
                id: `spike-${zoneId}-${curr.ts}`,
                vehicleId,
                zoneId,
                zoneName: zone.name,
                timestamp: curr.timestamp,
                temperatureStart: prev.temperature,
                temperatureEnd: curr.temperature,
                delta,
                deltaAbs: Math.abs(delta),
                direction,
                windowSeconds: Math.round(deltaT),
                latitude: gpsPoint.latitude,
                longitude: gpsPoint.longitude,
              }
            }
          }
          continue
        }
        lastReportedByZone.set(zoneId, curr.ts)

        spikes.push({
          id: `spike-${zoneId}-${curr.ts}`,
          vehicleId,
          zoneId,
          zoneName: zone.name,
          timestamp: curr.timestamp,
          temperatureStart: prev.temperature,
          temperatureEnd: curr.temperature,
          delta,
          deltaAbs: Math.abs(delta),
          direction,
          windowSeconds: Math.round(deltaT),
          latitude: gpsPoint.latitude,
          longitude: gpsPoint.longitude,
        })
      }
    }

    // 按时间排序
    return spikes.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
  },
}
