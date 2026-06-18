/**
 * 车辆列表(左侧):搜索 + 车辆卡片堆叠
 */
import { useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useMonitorStore } from '@/store/useMonitorStore'
import { VehicleCard } from './VehicleCard'

export function VehicleList() {
  const vehicles = useMonitorStore((s) => s.vehicles)
  const selectedVehicleId = useMonitorStore((s) => s.selectedVehicleId)
  const selectVehicle = useMonitorStore((s) => s.selectVehicle)
  const loadingVehicles = useMonitorStore((s) => s.loadingVehicles)

  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const k = q.trim()
    if (!k) return vehicles
    return vehicles.filter(
      (v) => v.plateNumber.includes(k) || v.model.includes(k),
    )
  }, [vehicles, q])

  return (
    <div className="flex h-full flex-col bg-cryo-900/60">
      <div className="border-b border-white/5 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索车牌 / 车型"
            className="w-full rounded-lg border border-white/5 bg-cryo-950/60 py-2 pl-8 pr-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-frost/50 focus:outline-none focus:ring-1 focus:ring-frost/30"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>车队车辆</span>
          <span className="font-mono">{filtered.length} / {vehicles.length}</span>
        </div>
      </div>

      <div className="cc-scroll flex-1 space-y-2 overflow-y-auto p-3">
        {loadingVehicles ? (
          <div className="flex items-center justify-center py-10 text-ice-400/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">未找到车辆</div>
        ) : (
          filtered.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              selected={v.id === selectedVehicleId}
              onSelect={() => selectVehicle(v.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
