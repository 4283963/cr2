/** HTTP 响应与查询参数工具 */
import type { Response } from 'express'
import type { ApiResponse } from '@shared/types'

export function ok<T>(res: Response, data: T): Response {
  const body: ApiResponse<T> = { success: true, data }
  return res.json(body)
}

export function fail(res: Response, status: number, message: string): Response {
  return res.status(status).json({ success: false, data: null, error: message })
}

/** 安全提取字符串型查询参数 */
export function queryStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}
