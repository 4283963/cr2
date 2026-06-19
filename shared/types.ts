/**
 * 前后端共享接口契约(shared/types.ts)
 * ---------------------------------------------
 * 该文件为前后端唯一对齐来源(single source of truth)。
 * 后端(api/)与前端(src/)均通过 `import type { ... } from '@shared/types'` 引用。
 * 仅包含类型定义与常量字符串,确保跨端零运行时耦合。
 */

/* ============================================================
 * 业务实体类型
 * ========================================================== */

/** 车辆运行状态 */
export type VehicleStatus = 'online' | 'offline' | 'transporting';

/** 温区配置(冷藏车的一个独立温控区域) */
export interface TemperatureZone {
  id: string;
  vehicleId: string;
  /** 温区名称,如:冷冻 / 冷藏 / 常温 */
  name: string;
  /** 温度下限 ℃ */
  minTemp: number;
  /** 温度上限 ℃ */
  maxTemp: number;
  /** 排序序号 */
  sortOrder: number;
}

/** 车辆基础信息(列表摘要) */
export interface VehicleSummary {
  id: string;
  /** 车牌号 */
  plateNumber: string;
  /** 车型 */
  model: string;
  /** 载重 kg */
  capacityKg: number;
  status: VehicleStatus;
  /** 温区数量 */
  zoneCount: number;
  /** 当前未处理告警数 */
  activeAlertCount: number;
}

/** 车辆详情(含温区配置) */
export interface VehicleDetail extends VehicleSummary {
  zones: TemperatureZone[];
}

/** GPS 轨迹点 */
export interface GpsPoint {
  id: string;
  vehicleId: string;
  /** ISO 时间字符串 */
  timestamp: string;
  latitude: number;
  longitude: number;
  /** 时速 km/h */
  speed: number;
  /** 航向角 0-359 */
  heading: number;
}

/** 多温区温度记录(某温区某时刻) */
export interface TemperatureReading {
  id: string;
  vehicleId: string;
  zoneId: string;
  zoneName: string;
  /** ISO 时间字符串 */
  timestamp: string;
  /** 实测温度 ℃ */
  temperature: number;
  minTemp: number;
  maxTemp: number;
  /** 是否越限告警(temperature 超出 [minTemp, maxTemp]) */
  isAlert: boolean;
}

/** 温度越限告警事件(带地图坐标,用于在地图上标记) */
export interface TemperatureAlert {
  id: string;
  vehicleId: string;
  zoneId: string;
  zoneName: string;
  timestamp: string;
  temperature: number;
  minTemp: number;
  maxTemp: number;
  /** 越限方向:过高 / 过低 */
  direction: 'high' | 'low';
  /** 越限温差(绝对值),用于告警严重度展示 */
  deviation: number;
  /** 关联轨迹点坐标(用于地图标记) */
  latitude: number;
  longitude: number;
}

/**
 * 温度骤变事件:1 分钟内某温区温度变化超过阈值(默认 5℃)
 * 即使温度仍在 [minTemp, maxTemp] 范围内,只要短时间内变化过快,
 * 就有可能是制冷/加热设备故障前兆,需要提醒调度员关注。
 */
export interface TemperatureSpike {
  id: string;
  vehicleId: string;
  zoneId: string;
  zoneName: string;
  /** 骤变发生的时刻(= 窗口结束点的时间) */
  timestamp: string;
  /** 窗口起始温度 */
  temperatureStart: number;
  /** 窗口结束温度 */
  temperatureEnd: number;
  /** 温度变化量(正数=上升,负数=下降) */
  delta: number;
  /** 变化绝对值,用于排序 */
  deltaAbs: number;
  /** 骤变方向 */
  direction: 'rising' | 'falling';
  /** 时间窗口大小(秒),用于展示"X 秒内变化了 Y℃" */
  windowSeconds: number;
  /** 关联轨迹点坐标(用于地图标记) */
  latitude: number;
  longitude: number;
}

/* ============================================================
 * API 端点契约
 * ========================================================== */

/** 后端 REST 端点路径常量(前端 API 客户端与后端路由共同对齐) */
export const API = {
  VEHICLES: '/api/vehicles',
  VEHICLE_DETAIL: (id: string) => `/api/vehicles/${id}`,
  TRAJECTORY: (id: string) => `/api/vehicles/${id}/trajectory`,
  TEMPERATURES: (id: string) => `/api/vehicles/${id}/temperatures`,
  ALERTS: (id: string) => `/api/vehicles/${id}/alerts`,
  SPIKES: (id: string) => `/api/vehicles/${id}/spikes`,
  HEALTH: '/api/health',
} as const;

/** 统一响应封装 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/** 轨迹/温度查询参数 */
export interface TrajectoryQuery {
  /** YYYY-MM-DD,默认当天 */
  date?: string;
}
