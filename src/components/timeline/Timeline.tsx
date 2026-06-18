/**
 * 时间轴(地图底部浮动)
 * 拖动回放轨迹,显示当前时间与告警分布。
 */
import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Clock, AlertTriangle } from 'lucide-react'
import { useMonitorStore } from '@/store/useMonitorStore'
import { formatClock } from '@/utils/format'
import { cn } from '@/lib/utils'

export function Timeline() {
  const trajectory = useMonitorStore((s) => s.trajectory)
  const alerts = useMonitorStore((s) => s.alerts)
  const activeIndex = useMonitorStore((s) => s.activeIndex)
  const setActiveIndex = useMonitorStore((s) => s.setActiveIndex)

  const [playing, setPlaying] = useState(false)

  const alertIndices = useMemo(() => {
    const set = new Set(alerts.map((a) => a.timestamp))
    const idx = new Set<number>()
    trajectory.forEach((p, i) => {
      if (set.has(p.timestamp)) idx.add(i)
    })
    return idx
  }, [alerts, trajectory])

  useEffect(() => {
    if (!playing) return
    if (trajectory.length === 0) return
    const timer = setInterval(() => {
      const next = useMonitorStore.getState().activeIndex + 1
      if (next >= trajectory.length) {
        setPlaying(false)
        return
      }
      setActiveIndex(next)
    }, 600)
    return () => clearInterval(timer)
  }, [playing, trajectory.length, setActiveIndex])

  if (trajectory.length === 0) return null

  const current = trajectory[activeIndex]
  const progress =
    trajectory.length > 1 ? (activeIndex / (trajectory.length - 1)) * 100 : 0

  return (
    <div className="cc-glass rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveIndex(0)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-ice-300"
            title="回到起点"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md bg-frost/20 p-1.5 text-frost transition hover:bg-frost/30"
            title={playing ? '暂停' : '播放'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setActiveIndex(trajectory.length - 1)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-ice-300"
            title="跳到末尾"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-ice-300">
          <Clock className="h-3.5 w-3.5" />
          {current ? formatClock(current.timestamp) : '--:--:--'}
        </div>

        <div className="relative flex-1">
          <div className="cc-track relative h-1.5 w-full rounded-full bg-cryo-950">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-ice-400 to-frost"
              style={{ width: `${progress}%` }}
            />
            {Array.from(alertIndices).map((i) => (
              <span
                key={i}
                className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-red-500/70"
                style={{ left: `${(i / (trajectory.length - 1)) * 100}%` }}
              />
            ))}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-frost bg-cryo-900 shadow-glow"
              style={{ left: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={trajectory.length - 1}
            value={activeIndex}
            onChange={(e) => {
              setPlaying(false)
              setActiveIndex(Number(e.target.value))
            }}
            className="cc-range absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <div
          className={cn(
            'flex items-center gap-1 font-mono text-[11px]',
            alertIndices.has(activeIndex) ? 'text-red-400' : 'text-slate-500',
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {activeIndex + 1}/{trajectory.length}
        </div>
      </div>
    </div>
  )
}
