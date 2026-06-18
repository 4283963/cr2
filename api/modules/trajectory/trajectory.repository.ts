/**
 * GPS 轨迹仓储
 * 提供车辆轨迹点查询(按日期过滤)。
 */
import { getStore, type GpsRecord } from '../../store/store.js'
import { isWithinDate, resolveDate } from '../../utils/date.js'

export const gpsRepository = {
  findTrajectoryByVehicle(vehicleId: string, date?: string): GpsRecord[] {
    const d = resolveDate(date)
    return getStore()
      .gpsPoints.filter(
        (g) => g.vehicleId === vehicleId && isWithinDate(g.timestamp, d),
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  },
}
