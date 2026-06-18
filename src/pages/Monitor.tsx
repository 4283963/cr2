/**
 * 监控主界面:左侧车辆列表 + 右侧地图(含温度面板与时间轴)
 *
 * 关键点:MapView 通过 React.lazy 异步加载,外层用 ErrorBoundary 包裹。
 * 这样即便地图依赖加载失败(leaflet chunk 崩溃、网络、兼容问题等),
 * 车辆列表、顶部状态栏、温度面板、时间轴都能正常显示,页面不会白屏。
 */
import { Suspense, lazy, useEffect } from 'react'
import { Map, Loader2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { VehicleList } from '@/components/vehicles/VehicleList'
import { TemperaturePanel } from '@/components/temperature/TemperaturePanel'
import { Timeline } from '@/components/timeline/Timeline'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useMonitorStore } from '@/store/useMonitorStore'

const MapView = lazy(() =>
  import('@/components/map/MapView').then((m) => ({ default: m.MapView })),
)

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cryo-950">
      <div className="flex items-center gap-2 text-sm font-mono text-ice-400/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        地图组件加载中…
      </div>
    </div>
  )
}

function MapDegraded({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cryo-950 p-4">
      <div className="cc-glass max-w-sm rounded-xl px-5 py-4 text-center">
        <Map className="mx-auto mb-2 h-8 w-8 text-amber-400" />
        <div className="font-mono text-sm font-semibold text-slate-200">
          地图组件加载失败
        </div>
        <div className="mt-1 line-clamp-3 font-mono text-[11px] text-slate-400">
          {error.message}
        </div>
        <div className="mt-2 font-mono text-[10px] text-slate-500">
          车辆列表与温度数据仍可正常查看
        </div>
        <button
          onClick={retry}
          className="mt-3 inline-flex items-center gap-1 rounded-md bg-frost/20 px-3 py-1.5 text-xs font-mono text-frost transition hover:bg-frost/30"
        >
          <Loader2 className="h-3 w-3" />
          重新加载地图
        </button>
      </div>
    </div>
  )
}

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
          <ErrorBoundary
            name="地图视图"
            fallback={(err, retry) => <MapDegraded error={err} retry={retry} />}
          >
            <Suspense fallback={<MapFallback />}>
              <MapView />
            </Suspense>
          </ErrorBoundary>
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
