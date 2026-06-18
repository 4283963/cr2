/**
 * 车辆卡片(列表项)
 */
import { Truck, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_LABEL, STATUS_DOT, STATUS_TEXT } from '@/utils/format'
import type { VehicleSummary } from '@shared/types'

interface Props {
  vehicle: VehicleSummary
  selected: boolean
  onSelect: () => void
}

export function VehicleCard({ vehicle, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all',
        selected
          ? 'border-frost/50 bg-cryo-700/60 shadow-glow'
          : 'border-white/5 bg-cryo-800/40 hover:border-ice-400/30 hover:bg-cryo-700/40',
      )}
    >
      {selected && (
        <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-frost to-ice-400" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[vehicle.status])} />
          <span className="font-mono text-sm font-semibold tracking-wide text-slate-100">
            {vehicle.plateNumber}
          </span>
        </div>
        {vehicle.activeAlertCount > 0 ? (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/15 px-1.5 text-[11px] font-bold text-red-400 ring-1 ring-red-500/40">
            {vehicle.activeAlertCount}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-emerald-400/70">正常</span>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">{vehicle.model}</span>
        <span className="ml-2 shrink-0">
          {(vehicle.capacityKg / 1000).toFixed(1)}t
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider">
        <span className={cn('font-mono', STATUS_TEXT[vehicle.status])}>
          {STATUS_LABEL[vehicle.status]}
        </span>
        <span className="flex items-center gap-1 font-mono text-ice-300/80">
          <Snowflake className="h-3 w-3" />
          {vehicle.zoneCount}温区
        </span>
      </div>
    </button>
  )
}
