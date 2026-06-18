/**
 * 地图视图组件
 * - 绘制行驶路线折线
 * - 沿路线渲染温度采样节点(正常青色 / 越限红色)
 * - 越限告警以脉冲标记突出,带详情 Tooltip
 * - 当前车辆位置随时间轴移动
 */
import { useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  AttributionControl,
} from 'react-leaflet'
import { AlertTriangle, Thermometer, TrendingUp, TrendingDown } from 'lucide-react'
import { useMonitorStore } from '@/store/useMonitorStore'
import { createAlertIcon, createTruckIcon } from './icons'
import { FitBounds } from './FitBounds'
import { formatTime, formatTemp } from '@/utils/format'
import type { TemperatureAlert } from '@shared/types'

interface AlertGroup {
  key: string
  lat: number
  lng: number
  items: TemperatureAlert[]
}

const SHANGHAI: [number, number] = [31.23, 121.47]

export function MapView() {
  const trajectory = useMonitorStore((s) => s.trajectory)
  const alerts = useMonitorStore((s) => s.alerts)
  const activeIndex = useMonitorStore((s) => s.activeIndex)
  const setActiveIndex = useMonitorStore((s) => s.setActiveIndex)
  const loadingVehicle = useMonitorStore((s) => s.loadingVehicle)

  const positions = useMemo<[number, number][]>(
    () => trajectory.map((p) => [p.latitude, p.longitude]),
    [trajectory],
  )

  const alertTimestamps = useMemo(
    () => new Set(alerts.map((a) => a.timestamp)),
    [alerts],
  )

  const alertGroups = useMemo<AlertGroup[]>(() => {
    const map = new Map<string, AlertGroup>()
    for (const a of alerts) {
      const g = map.get(a.timestamp)
      if (g) g.items.push(a)
      else map.set(a.timestamp, { key: a.id, lat: a.latitude, lng: a.longitude, items: [a] })
    }
    return Array.from(map.values())
  }, [alerts])

  const activePoint = trajectory[activeIndex] ?? null

  if (loadingVehicle && trajectory.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cryo-950">
        <div className="animate-pulse text-sm font-mono text-ice-400/70">
          正在加载轨迹与温度数据…
        </div>
      </div>
    )
  }

  if (trajectory.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cryo-950">
        <div className="text-center">
          <Thermometer className="mx-auto mb-3 h-10 w-10 text-ice-400/40" />
          <p className="font-mono text-sm text-slate-400">
            请在左侧选择一辆冷藏车查看轨迹
          </p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={SHANGHAI}
      zoom={11}
      className="h-full w-full cc-map"
      zoomControl={false}
      attributionControl={false}
    >
      <AttributionControl position="topright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        subdomains="abcd"
        maxZoom={19}
      />

      {positions.length > 1 && (
        <>
          <Polyline
            positions={positions}
            pathOptions={{ color: '#0e7490', weight: 9, opacity: 0.3 }}
          />
          <Polyline
            positions={positions}
            pathOptions={{ color: '#22d3ee', weight: 3.5, opacity: 0.9 }}
          />
        </>
      )}

      {trajectory.map((p, i) => {
        const hasAlert = alertTimestamps.has(p.timestamp)
        const isActive = i === activeIndex
        return (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={isActive ? 7 : 4}
            pathOptions={{
              color: hasAlert ? '#ef4444' : '#38bdf8',
              fillColor: hasAlert ? '#ef4444' : '#38bdf8',
              fillOpacity: isActive ? 1 : 0.8,
              weight: isActive ? 2.5 : 1,
            }}
            eventHandlers={{ click: () => setActiveIndex(i) }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <div className="font-mono text-[11px]">
                <div className="text-slate-200">{formatTime(p.timestamp)}</div>
                <div className="text-ice-300">
                  {p.speed} km/h · {hasAlert ? '温度异常' : '温度正常'}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      {alertGroups.map((g) => (
        <Marker key={g.key} position={[g.lat, g.lng]} icon={createAlertIcon()} zIndexOffset={500}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <div className="min-w-[140px] font-mono text-[11px]">
              <div className="mb-1 flex items-center gap-1 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-semibold">温度越限告警</span>
              </div>
              <div className="text-slate-300">{formatTime(g.items[0].timestamp)}</div>
              {g.items.map((a) => (
                <div key={a.id} className="mt-0.5 flex items-center justify-between gap-3">
                  <span className="text-slate-300">{a.zoneName}</span>
                  <span className="flex items-center gap-1 text-red-400">
                    {a.direction === 'high' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatTemp(a.temperature)}
                  </span>
                </div>
              ))}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {activePoint && (
        <Marker
          position={[activePoint.latitude, activePoint.longitude]}
          icon={createTruckIcon(activePoint.heading)}
          zIndexOffset={1000}
        />
      )}

      <FitBounds positions={positions} />
    </MapContainer>
  )
}
