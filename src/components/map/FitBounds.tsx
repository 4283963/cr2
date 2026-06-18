/** 轨迹自适应:车辆切换时自动缩放到路线范围 */
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface FitBoundsProps {
  positions: [number, number][]
}

export function FitBounds({ positions }: FitBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 14)
      return
    }
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [70, 70] })
  }, [map, positions])

  return null
}
