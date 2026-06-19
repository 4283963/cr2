/**
 * 地图标记图标工厂(基于 Leaflet divIcon + CSS,无图片资源)
 *
 * 注意:leaflet 库体积大,顶层静态 import 会拖慢首屏甚至让开发服务器崩掉,
 * 所以这里延迟加载,只有真正调用工厂函数时才 import L。
 */
import type L from 'leaflet'

let _L: typeof L | null = null
let _loadPromise: Promise<typeof L> | null = null

async function getL(): Promise<typeof L> {
  if (_L) return _L
  if (_loadPromise) return _loadPromise
  _loadPromise = import('leaflet').then((mod) => {
    const L = mod.default
    // 修复 leaflet 默认 marker 图标资源路径(消除潜在 404)
    const Default = L.Icon.Default as unknown as {
      prototype?: { _getIconUrl?: unknown }
      mergeOptions?: (o: Record<string, string>) => void
    }
    if (Default?.prototype) {
      delete Default.prototype._getIconUrl
    }
    Default?.mergeOptions?.({
      iconRetinaUrl: '',
      iconUrl: '',
      shadowUrl: '',
    })
    _L = L
    return L
  })
  return _loadPromise
}

/** 仅当已加载过才返回 L;否则返回 null,调用方可以决定是否降级或跳过渲染 */
export function getLSync(): typeof L | null {
  return _L
}

export async function createAlertIcon(): Promise<L.DivIcon> {
  const L = await getL()
  return L.divIcon({
    className: 'cc-alert-marker',
    html: '<span class="cc-alert-marker__dot"></span><span class="cc-alert-marker__ring"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

export async function createTruckIcon(heading: number): Promise<L.DivIcon> {
  const L = await getL()
  return L.divIcon({
    className: 'cc-truck-marker',
    html: `<div class="cc-truck-marker__pin" style="transform: rotate(${heading}deg)"><span class="cc-truck-marker__arrow"></span></div><span class="cc-truck-marker__core"></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

/** 温度骤变标记:黄色感叹号 */
export async function createSpikeIcon(): Promise<L.DivIcon> {
  const L = await getL()
  return L.divIcon({
    className: 'cc-spike-marker',
    html: '<span class="cc-spike-marker__bg"></span><span class="cc-spike-marker__icon">!</span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}
