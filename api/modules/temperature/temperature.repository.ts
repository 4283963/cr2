/**
 * 多温区温度仓储
 * 提供温度记录查询与告警计数。
 */
import { getStore, type TemperatureRecord, type ZoneRecord } from '../../store/store.js'
import { isWithinDate, resolveDate } from '../../utils/date.js'

export const temperatureRepository = {
  findReadingsByVehicle(vehicleId: string, date?: string): TemperatureRecord[] {
    const d = resolveDate(date)
    return getStore()
      .temperatures.filter(
        (t) => t.vehicleId === vehicleId && isWithinDate(t.timestamp, d),
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  },

  /** 统计某车某日越限告警次数(用于车辆摘要的 activeAlertCount) */
  countAlertsByVehicle(vehicleId: string, date?: string): number {
    const d = resolveDate(date)
    const store = getStore()
    const zoneMap = new Map<string, ZoneRecord>(
      store.zones.filter((z) => z.vehicleId === vehicleId).map((z) => [z.id, z]),
    )
    return store.temperatures.filter((t) => {
      if (t.vehicleId !== vehicleId || !isWithinDate(t.timestamp, d)) return false
      const zone = zoneMap.get(t.zoneId)
      if (!zone) return false
      return t.temperature < zone.minTemp || t.temperature > zone.maxTemp
    }).length
  },
}
