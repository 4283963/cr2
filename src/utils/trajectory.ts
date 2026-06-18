/**
 * 轨迹点相关性能工具
 * - Ramer-Douglas-Peucker 抽稀(用于折线绘制,减少 Polyline 顶点)
 * - 等距采样(用于可视化 CircleMarker,避免渲染几千个点)
 */
import type { GpsPoint } from '@shared/types'

const DEG_TO_M = 111320

function pointLineDistance(
  p: GpsPoint,
  a: GpsPoint,
  b: GpsPoint,
): number {
  const dx = b.longitude - a.longitude
  const dy = b.latitude - a.latitude
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return Math.hypot(p.longitude - a.longitude, p.latitude - a.latitude) * DEG_TO_M
  }
  let t =
    ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const x = a.longitude + t * dx
  const y = a.latitude + t * dy
  return Math.hypot(p.longitude - x, p.latitude - y) * DEG_TO_M
}

function rdp(points: GpsPoint[], epsilonMeters: number): GpsPoint[] {
  if (points.length < 3) return points.slice()
  let maxDist = 0
  let maxIndex = 0
  const start = points[0]
  const end = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointLineDistance(points[i], start, end)
    if (d > maxDist) {
      maxDist = d
      maxIndex = i
    }
  }
  if (maxDist > epsilonMeters) {
    const left = rdp(points.slice(0, maxIndex + 1), epsilonMeters)
    const right = rdp(points.slice(maxIndex), epsilonMeters)
    return [...left.slice(0, -1), ...right]
  }
  return [start, end]
}

/**
 * RDP 抽稀折线,自动选择阈值。
 * - 点位数<=SIMPLIFY_MIN:原样返回
 * - 否则:目标点数控制在 80~160 之间
 */
export function simplifyTrajectory(points: GpsPoint[]): GpsPoint[] {
  const SIMPLIFY_MIN = 120
  const TARGET_MAX = 140
  if (points.length <= SIMPLIFY_MIN) return points
  let lo = 1
  let hi = 500
  let best = points
  for (let iter = 0; iter < 12; iter++) {
    const mid = (lo + hi) / 2
    const s = rdp(points, mid)
    if (s.length > TARGET_MAX) {
      lo = mid
    } else {
      hi = mid
      best = s
    }
  }
  return best
}

export interface SampledPoint extends GpsPoint {
  /** 在原始 trajectory 数组中的索引 */
  originalIndex: number
}

/**
 * 可视化采样:从完整轨迹中选出最多 maxCount 个点用于 CircleMarker 渲染。
 * 策略:总是保留首点、尾点、所有告警点,中间按等距间隔补齐。
 */
export function sampleForVisualization(
  points: GpsPoint[],
  alertTimestamps: Set<string>,
  maxCount = 72,
): SampledPoint[] {
  if (points.length === 0) return []
  if (points.length <= maxCount) {
    return points.map((p, i) => ({ ...p, originalIndex: i }))
  }

  const keepIdx = new Set<number>()
  keepIdx.add(0)
  keepIdx.add(points.length - 1)

  for (let i = 0; i < points.length; i++) {
    if (alertTimestamps.has(points[i].timestamp)) keepIdx.add(i)
  }

  const remaining = maxCount - keepIdx.size
  if (remaining > 0) {
    const step = (points.length - 1) / (remaining + 1)
    for (let k = 1; k <= remaining; k++) {
      const idx = Math.round(step * k)
      keepIdx.add(Math.min(points.length - 1, Math.max(0, idx)))
    }
  }

  return Array.from(keepIdx)
    .sort((a, b) => a - b)
    .map((i) => ({ ...points[i], originalIndex: i }))
}
