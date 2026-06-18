/**
 * 监控主界面:左侧车辆列表 + 右侧地图(含温度面板与时间轴)
 */
import { useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { VehicleList } from '@/components/vehicles/VehicleList'
import { MapView } from '@/components/map/MapView'
import { TemperaturePanel } from '@/components/temperature/TemperaturePanel'
import { Timeline } from '@/components/timeline/Timeline'
import { useMonitorStore } from '@/store/useMonitorStore'

export default function Monitor() {
  const loadVehicles = useMonitorStore((s) => s.loadVehicles)
  const error = useMonitorStore((s) => s.error)

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cryo-950 font-sans text-slate-200">
      <TopBar />
      {error && (
        <div className="bg-red-500/10 px-4 py-1.5 text-center font-mono text-xs text-red-400">
          数据加载异常:{error}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-white/5">
          <VehicleList />
        </aside>
        <main className="relative flex-1">
          <MapView />
          <div className="pointer-events-none absolute left-4 top-4 z-[1000]">
            <div className="pointer-events-auto">
              <TemperaturePanel />
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="pointer-events-auto mx-auto max-w-3xl">
              <Timeline />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
