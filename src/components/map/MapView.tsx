/**
 * 地图视图组件
 *
 * 关键设计:
 * 1. 整个组件通过 React.lazy 从 Monitor 懒加载,外层用 ErrorBoundary 包裹,
 *    即使 leaflet 加载失败也不影响车辆列表和主界面。
 * 2. 轨迹点多的时候:
 *    - Polyline 用 RDP 抽稀,避免几万顶点重绘卡顿
 *    - CircleMarker 做等距采样(最多 72 个点) + 强制保留所有告警点
 * 3. marker icon 通过异步创建(因为 leaflet 懒加载),用 useState 缓存。
 *
 * 注意:leaflet.css 也在这里按需 import,不放在 main.tsx 里,
 * 避免地图依赖在首屏同步拉取导致白屏。
 */
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  AttributionControl,
} from 'react-leaflet'
import type { DivIcon } from 'leaflet'
import { AlertTriangle, Thermometer, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { useMonitorStore } from '@/store/useMonitorStore'
import { createAlertIcon, createTruckIcon } from './icons'
import { FitBounds } from './FitBounds'
import { formatTime, formatTemp } from '@/utils/format'
import { simplifyTrajectory, sampleForVisualization } from '@/utils/trajectory'
import type { SampledPoint } from '@/utils/trajectory'
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

  const [alertIcon, setAlertIcon] = useState<DivIcon | null>(null)
  const [iconsLoading, setIconsLoading] = useState(true)

  // 预创建 DivIcon(只需一次)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ic = await createAlertIcon()
        if (!cancelled) setAlertIcon(ic)
      } finally {
        if (!cancelled) setIconsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 按 activePoint.heading 变化重建 truck icon
  const activePoint = trajectory[activeIndex] ?? null
  const [truckIcon, setTruckIcon] = useState<DivIcon | null>(null)
  useEffect(() => {
    if (!activePoint) {
      setTruckIcon(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const ic = await createTruckIcon(activePoint.heading)
      if (!cancelled) setTruckIcon(ic)
    })()
    return () => {
      cancelled = true
    }
  }, [activePoint?.heading])

  const alertTimestamps = useMemo(
    () => new Set<string>(alerts.map((a) => a.timestamp)),
    [alerts],
  )

  const alertGroups = useMemo<AlertGroup[]>(() => {
    const map = new Map<string, AlertGroup>()
    for (const a of alerts) {
      const g = map.get(a.timestamp)
      if (g) g.items.push(a)
      else
        map.set(a.timestamp, {
          key: a.id,
          lat: a.latitude,
          lng: a.longitude,
          items: [a],
        })
    }
    return Array.from(map.values())
  }, [alerts])

  // 折线抽稀
  const simplifiedPositions: [number, number][] = useMemo(() => {
    if (trajectory.length === 0) return []
    return simplifyTrajectory(trajectory).map((p) => [p.latitude, p.longitude])
  }, [trajectory])

  // CircleMarker 采样
  const visiblePoints: SampledPoint[] = useMemo(
    () => sampleForVisualization(trajectory, alertTimestamps),
    [trajectory, alertTimestamps],
  )

  const fullPositions: [number, number][] = useMemo(
    () => trajectory.map((p) => [p.latitude, p.longitude]),
    [trajectory],
  )

  const onPointClick = useCallback(
    (index: number) => setActiveIndex(index),
    [setActiveIndex],
  )

  if (loadingVehicle && trajectory.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cryo-950">
        <div className="flex items-center gap-2 text-sm font-mono text-ice-400/70">
          <Loader2 className="h-4 w-4 animate-spin" />
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

      {simplifiedPositions.length > 1 && (
        <>
          <Polyline
            positions={simplifiedPositions}
            pathOptions={{ color: '#0e7490', weight: 9, opacity: 0.3 }}
          />
          <Polyline
            positions={simplifiedPositions}
            pathOptions={{ color: '#22d3ee', weight: 3.5, opacity: 0.9 }}
          />
        </>
      )}

      {visiblePoints.map((p) => {
        const hasAlert = alertTimestamps.has(p.timestamp)
        const isActive = p.id === trajectory[activeIndex]?.id
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
            eventHandlers={{ click: () => onPointClick(p.originalIndex) }}
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

      {!iconsLoading &&
        alertIcon &&
        alertGroups.map((g) => (
          <Marker
            key={g.key}
            position={[g.lat, g.lng]}
            icon={alertIcon}
            zIndexOffset={500}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="min-w-[140px] font-mono text-[11px]">
                <div className="mb-1 flex items-center gap-1 text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-semibold">温度越限告警</span>
                </div>
                <div className="text-slate-300">{formatTime(g.items[0].timestamp)}</div>
                {g.items.map((a) => (
                  <div
                    key={a.id}
                    className="mt-0.5 flex items-center justify-between gap-3"
                  >
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

      {!iconsLoading && truckIcon && activePoint && (
        <Marker
          position={[activePoint.latitude, activePoint.longitude]}
          icon={truckIcon}
          zIndexOffset={1000}
        />
      )}

      <FitBounds positions={fullPositions} />
    </MapContainer>
  )
}
