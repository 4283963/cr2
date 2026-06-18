/**
 * 温度详情面板(地图左上浮动)
 * 展示当前时间点各温区温度、阈值区间与越限状态。
 */
import { Thermometer, Gauge, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  useMonitorStore,
  useReadingsAtActive,
  useActiveGpsPoint,
} from '@/store/useMonitorStore'
import {
  formatClock,
  formatTemp,
  tempStatus,
  TEMP_STATUS_COLOR,
} from '@/utils/format'
import { cn } from '@/lib/utils'

function rangePercent(temp: number, min: number, max: number): number {
  const lo = min - 3
  const hi = max + 3
  const pct = ((temp - lo) / (hi - lo)) * 100
  return Math.max(2, Math.min(98, pct))
}

export function TemperaturePanel() {
  const vehicleDetail = useMonitorStore((s) => s.vehicleDetail)
  const readings = useReadingsAtActive()
  const activePoint = useActiveGpsPoint()

  if (!vehicleDetail || !activePoint || readings.length === 0) return null

  const order = new Map(vehicleDetail.zones.map((z) => [z.id, z.sortOrder]))
  const sorted = [...readings].sort(
    (a, b) => (order.get(a.zoneId) ?? 0) - (order.get(b.zoneId) ?? 0),
  )
  const alertCount = sorted.filter((r) => r.isAlert).length

  return (
    <div className="cc-glass w-[300px] overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-frost" />
          <span className="font-mono text-sm font-semibold text-slate-100">
            {vehicleDetail.plateNumber}
          </span>
        </div>
        {alertCount > 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/40">
            <AlertTriangle className="h-3 w-3" />
            {alertCount} 越限
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            正常
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 border-b border-white/5 px-3 py-2 font-mono text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatClock(activePoint.timestamp)}
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          {activePoint.speed} km/h
        </span>
      </div>

      <div className="space-y-2.5 p-3">
        {sorted.map((r) => {
          const status = tempStatus(r.temperature, r.minTemp, r.maxTemp)
          return (
            <div key={r.id}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-300">{r.zoneName}</span>
                <span className={cn('font-mono text-base font-bold', TEMP_STATUS_COLOR[status])}>
                  {formatTemp(r.temperature)}
                </span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-cryo-950">
                <div
                  className="absolute top-0 h-full rounded-full bg-emerald-500/30"
                  style={{
                    left: `${rangePercent(r.minTemp, r.minTemp, r.maxTemp)}%`,
                    right: `${100 - rangePercent(r.maxTemp, r.minTemp, r.maxTemp)}%`,
                  }}
                />
                <div
                  className={cn(
                    'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-cryo-900',
                    status === 'normal' ? 'bg-emerald-400' : status === 'high' ? 'bg-red-500' : 'bg-amber-alert',
                  )}
                  style={{ left: `${rangePercent(r.temperature, r.minTemp, r.maxTemp)}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between font-mono text-[10px] text-slate-500">
                <span>{r.minTemp}°</span>
                <span>{r.maxTemp}°</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
