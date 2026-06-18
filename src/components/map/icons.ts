/**
 * 地图标记图标工厂(基于 Leaflet divIcon + CSS,无图片资源)
 */
import L from 'leaflet'

/** 越限告警标记:红色脉冲点 */
export function createAlertIcon(): L.DivIcon {
  return L.divIcon({
    className: 'cc-alert-marker',
    html: '<span class="cc-alert-marker__dot"></span><span class="cc-alert-marker__ring"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

/** 当前车辆位置标记:随航向旋转的指针 */
export function createTruckIcon(heading: number): L.DivIcon {
  return L.divIcon({
    className: 'cc-truck-marker',
    html: `<div class="cc-truck-marker__pin" style="transform: rotate(${heading}deg)"><span class="cc-truck-marker__arrow"></span></div><span class="cc-truck-marker__core"></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

/** 起点标记 */
export function createStartIcon(): L.DivIcon {
  return L.divIcon({
    className: 'cc-start-marker',
    html: '<span class="cc-start-marker__dot"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}
