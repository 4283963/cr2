/**
 * 种子数据生成(seed)
 * 生成多温区冷藏车、GPS 轨迹、多温区温度记录(含越限告警注入)。
 * 使用确定性 PRNG,保证每次重启数据稳定,便于演示。
 */
import { getStore, resetStore, type ZoneRecord, type VehicleRecord } from './store.js'
import type { VehicleStatus } from '@shared/types'

/* ---------- 确定性随机 ---------- */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260619)

/* ---------- 时间工具 ---------- */
function startOfToday(): Date {
  const d = new Date()
  d.setHours(6, 0, 0, 0)
  return d
}

function timestampAt(minutesFromStart: number): string {
  const d = new Date(startOfToday().getTime() + minutesFromStart * 60_000)
  return d.toISOString()
}

/* ---------- 路线插值 ---------- */
type LngLat = { lat: number; lng: number }

const ROUTES: Record<string, LngLat[]> = {
  // 浦东 外高桥 → 机场 → 临港
  pudong: [
    { lat: 31.355, lng: 121.585 },
    { lat: 31.312, lng: 121.62 },
    { lat: 31.27, lng: 121.66 },
    { lat: 31.21, lng: 121.74 },
    { lat: 31.16, lng: 121.81 },
    { lat: 31.08, lng: 121.83 },
    { lat: 30.97, lng: 121.79 },
  ],
  // 嘉定 → 江桥 → 虹桥
  hongqiao: [
    { lat: 31.348, lng: 121.246 },
    { lat: 31.31, lng: 121.28 },
    { lat: 31.27, lng: 121.312 },
    { lat: 31.225, lng: 121.336 },
    { lat: 31.196, lng: 121.336 },
    { lat: 31.17, lng: 121.31 },
  ],
  // 闵行 → 松江 → 青浦
  qingpu: [
    { lat: 31.112, lng: 121.39 },
    { lat: 31.05, lng: 121.32 },
    { lat: 31.0, lng: 121.24 },
    { lat: 31.02, lng: 121.16 },
    { lat: 31.1, lng: 121.12 },
    { lat: 31.18, lng: 121.1 },
  ],
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function interpolateRoute(waypoints: LngLat[], totalPoints: number): LngLat[] {
  const points: LngLat[] = []
  const segLen = (waypoints.length - 1) / (totalPoints - 1)
  for (let i = 0; i < totalPoints; i++) {
    const pos = i * segLen
    const seg = Math.min(Math.floor(pos), waypoints.length - 2)
    const t = pos - seg
    const a = waypoints[seg]
    const b = waypoints[seg + 1]
    const jitter = 0.0016
    points.push({
      lat: lerp(a.lat, b.lat, t) + (rng() - 0.5) * jitter,
      lng: lerp(a.lng, b.lng, t) + (rng() - 0.5) * jitter,
    })
  }
  return points
}

function bearing(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/* ---------- 温区预设 ---------- */
type ZoneKind = 'frozen' | 'chilled' | 'ambient'
const ZONE_PRESETS: Record<ZoneKind, Omit<ZoneRecord, 'id' | 'vehicleId' | 'sortOrder'>> = {
  frozen: { name: '冷冻区', minTemp: -25, maxTemp: -18 },
  chilled: { name: '冷藏区', minTemp: 2, maxTemp: 8 },
  ambient: { name: '常温区', minTemp: 15, maxTemp: 25 },
}

function zoneSetpoint(kind: ZoneKind): number {
  const p = ZONE_PRESETS[kind]
  return (p.minTemp + p.maxTemp) / 2
}

function zoneNoise(kind: ZoneKind): number {
  const p = ZONE_PRESETS[kind]
  const span = p.maxTemp - p.minTemp
  return (rng() - 0.5) * span * 0.5
}

/* ---------- 车辆配置 ---------- */
interface VehicleConfig {
  id: string
  plate: string
  model: string
  capacity: number
  status: VehicleStatus
  zones: ZoneKind[]
  route: keyof typeof ROUTES
  /** 越限注入:在某温区某些轨迹点索引上施加偏移 */
  alertInjections: Array<{ kind: ZoneKind; from: number; to: number; delta: number }>
  /**
   * 骤变注入:在某个温度采样点索引上施加瞬时大偏移(>5℃)。
   * 用于演示骤变检测,即使温度仍在阈值内,短时间内变化过快也要标记。
   * index 是温度采样点的索引(0 ~ (TRAJECTORY_POINTS * TEMP_SAMPLES_PER_GPS)。
   */
  spikeInjections: Array<{ kind: ZoneKind; index: number; delta: number }>
}

const VEHICLE_CONFIGS: VehicleConfig[] = [
  {
    id: 'v1',
    plate: '沪A·冷藏01',
    model: '解放J6P 多温区',
    capacity: 18000,
    status: 'transporting',
    zones: ['frozen', 'chilled', 'ambient'],
    route: 'pudong',
    alertInjections: [
      { kind: 'chilled', from: 18, to: 22, delta: 4.5 },
      { kind: 'frozen', from: 32, to: 33, delta: 3.5 },
    ],
    spikeInjections: [
      { kind: 'chilled', index: 56, delta: 15.8 },
      { kind: 'frozen', index: 92, delta: -12.2 },
    ],
  },
  {
    id: 'v2',
    plate: '沪B·冷藏02',
    model: '福田欧曼 双温区',
    capacity: 12000,
    status: 'online',
    zones: ['frozen', 'chilled'],
    route: 'hongqiao',
    alertInjections: [{ kind: 'chilled', from: 14, to: 16, delta: 3.0 }],
    spikeInjections: [],
  },
  {
    id: 'v3',
    plate: '苏E·冷藏03',
    model: '陕汽德龙 多温区',
    capacity: 20000,
    status: 'transporting',
    zones: ['frozen', 'chilled', 'ambient'],
    route: 'qingpu',
    alertInjections: [
      { kind: 'chilled', from: 24, to: 27, delta: 3.8 },
      { kind: 'ambient', from: 6, to: 8, delta: -2.5 },
    ],
    spikeInjections: [
      { kind: 'ambient', index: 28, delta: 18.0 },
    ],
  },
  {
    id: 'v4',
    plate: '浙A·冷藏04',
    model: '江淮格尔发 双温区',
    capacity: 15000,
    status: 'offline',
    zones: ['chilled', 'ambient'],
    route: 'hongqiao',
    alertInjections: [],
    spikeInjections: [],
  },
  {
    id: 'v5',
    plate: '沪C·冷藏05',
    model: '解放J7 多温区',
    capacity: 22000,
    status: 'transporting',
    zones: ['frozen', 'chilled', 'ambient'],
    route: 'pudong',
    alertInjections: [
      { kind: 'frozen', from: 10, to: 12, delta: 2.8 },
      { kind: 'ambient', from: 34, to: 36, delta: 4.0 },
    ],
    spikeInjections: [],
  },
]

const TRAJECTORY_POINTS = 44
const INTERVAL_MIN = 13
/** 每个轨迹点之间插多少个温度采样点(提高密度,确保 1 分钟窗口能覆盖多个读数) */
const TEMP_SAMPLES_PER_GPS = 4
/** 温度采样间隔(分钟)。总间隔 = INTERVAL_MIN / TEMP_SAMPLES_PER_GPS */
const TEMP_INTERVAL_MIN = INTERVAL_MIN / TEMP_SAMPLES_PER_GPS

/* ---------- 生成入口 ---------- */
export function seedStore(): void {
  resetStore()
  const store = getStore()

  for (const cfg of VEHICLE_CONFIGS) {
    const vehicle: VehicleRecord = {
      id: cfg.id,
      plateNumber: cfg.plate,
      model: cfg.model,
      capacityKg: cfg.capacity,
      status: cfg.status,
    }
    store.vehicles.push(vehicle)

    let sortOrder = 0
    const zoneIds: Record<ZoneKind, string> = {} as Record<ZoneKind, string>
    for (const kind of cfg.zones) {
      const zoneId = `${cfg.id}-z-${kind}`
      zoneIds[kind] = zoneId
      store.zones.push({
        id: zoneId,
        vehicleId: cfg.id,
        ...ZONE_PRESETS[kind],
        sortOrder: sortOrder++,
      })
    }

    // 轨迹
    const path = interpolateRoute(ROUTES[cfg.route], TRAJECTORY_POINTS)
    const gpsIds: string[] = []
    for (let i = 0; i < path.length; i++) {
      const cur = path[i]
      const prev = i > 0 ? path[i - 1] : cur
      const next = path[i + 1] ?? cur
      const distKm = haversineKm(prev, cur)
      const speed = i === 0 ? 0 : Math.min(95, Math.round((distKm / (INTERVAL_MIN / 60)) * 10) / 10)
      const gpsId = `${cfg.id}-g-${String(i).padStart(3, '0')}`
      gpsIds.push(gpsId)
      store.gpsPoints.push({
        id: gpsId,
        vehicleId: cfg.id,
        timestamp: timestampAt(i * INTERVAL_MIN),
        latitude: Number(cur.lat.toFixed(6)),
        longitude: Number(cur.lng.toFixed(6)),
        speed,
        heading: Math.round(bearing(cur, next)),
      })
    }

    // 温度:每个 GPS 间隔内采 TEMP_SAMPLES_PER_GPS 个点,提高密度便于骤变检测
    const totalTempSamples = TRAJECTORY_POINTS * TEMP_SAMPLES_PER_GPS
    for (let si = 0; si < totalTempSamples; si++) {
      const ts = timestampAt(si * TEMP_INTERVAL_MIN)
      // 该温度采样点在哪个 GPS 段内(用于 alertInjections)
      const gpsIndex = Math.floor(si / TEMP_SAMPLES_PER_GPS)
      for (const kind of cfg.zones) {
        let temp = zoneSetpoint(kind) + zoneNoise(kind)
        // 越限注入:按 GPS 点索引范围
        for (const inj of cfg.alertInjections) {
          if (inj.kind === kind && gpsIndex >= inj.from && gpsIndex <= inj.to) {
            temp = temp + inj.delta
          }
        }
        // 骤变注入:按温度采样点精确索引,瞬时大偏移
        for (const inj of cfg.spikeInjections) {
          if (inj.kind === kind && si === inj.index) {
            temp = temp + inj.delta
          }
        }
        temp = Math.round(temp * 10) / 10
        store.temperatures.push({
          id: `${cfg.id}-t-${kind}-${String(si).padStart(4, '0')}`,
          vehicleId: cfg.id,
          zoneId: zoneIds[kind],
          timestamp: ts,
          temperature: temp,
        })
      }
    }
  }
}

