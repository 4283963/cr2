/**
 * 顶部状态栏:标题 + 车队统计
 */
import { Snowflake, Truck, AlertTriangle, Activity } from 'lucide-react'
import { useMonitorStore } from '@/store/useMonitorStore'

export function TopBar() {
  const vehicles = useMonitorStore((s) => s.vehicles)
  const transporting = vehicles.filter((v) => v.status === 'transporting').length
  const totalAlerts = vehicles.reduce((sum, v) => sum + v.activeAlertCount, 0)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-cryo-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-frost to-ice-400 shadow-glow">
          <Snowflake className="h-4 w-4 text-cryo-950" />
        </div>
        <div>
          <h1 className="font-display text-base font-semibold leading-none tracking-wide text-slate-100">
            冷链智控中心
          </h1>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ice-400/60">
            Cold Chain Fleet Monitor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Stat icon={<Truck className="h-3.5 w-3.5" />} label="车辆总数" value={vehicles.length} tone="default" />
        <Stat icon={<Activity className="h-3.5 w-3.5" />} label="运输中" value={transporting} tone="active" />
        <Stat
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="温度告警"
          value={totalAlerts}
          tone={totalAlerts > 0 ? 'alert' : 'ok'}
        />
      </div>
    </header>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'default' | 'active' | 'alert' | 'ok'
}) {
  const toneCls =
    tone === 'alert'
      ? 'text-red-400'
      : tone === 'active'
        ? 'text-sky-400'
        : tone === 'ok'
          ? 'text-emerald-400'
          : 'text-slate-200'
  return (
    <div className="flex items-center gap-2">
      <span className={toneCls}>{icon}</span>
      <div className="leading-none">
        <div className={`font-mono text-lg font-bold ${toneCls}`}>{value}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
    </div>
  )
}
