/** 日期工具:统一处理轨迹/温度查询的日期过滤 */

export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 将 ISO 时间字符串转为本地日期(YYYY-MM-DD) */
export function localDateOf(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 判断 ISO 时间是否属于指定日期(本地) */
export function isWithinDate(iso: string, date: string): boolean {
  return localDateOf(iso) === date
}

/** 解析查询日期,缺省时取当天 */
export function resolveDate(date: string | undefined): string {
  return date && date.trim() ? date.trim() : todayStr()
}
