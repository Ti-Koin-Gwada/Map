import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from '@vis.gl/react-google-maps'

export default function HtmlMarker({ position, children }) {
  const map = useMap()
  const container = useRef(null)
  const overlayRef = useRef(null)
  const positionRef = useRef(position)

  if (!container.current) {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    container.current = el
  }

  useEffect(() => {
    positionRef.current = position
    overlayRef.current?.draw()
  }, [position.lat, position.lng])

  useEffect(() => {
    if (!map || !window.google?.maps) return

    const ov = new window.google.maps.OverlayView()

    ov.onAdd = function () {
      this.getPanes().overlayMouseTarget.appendChild(container.current)
    }

    ov.draw = function () {
      const proj = this.getProjection()
      if (!proj) return
      const pt = proj.fromLatLngToDivPixel(
        new window.google.maps.LatLng(positionRef.current.lat, positionRef.current.lng)
      )
      if (pt) {
        container.current.style.left = `${pt.x}px`
        container.current.style.top = `${pt.y}px`
      }
    }

    ov.onRemove = function () {
      container.current.parentNode?.removeChild(container.current)
    }

    ov.setMap(map)
    overlayRef.current = ov

    return () => ov.setMap(null)
  }, [map])

  return createPortal(children, container.current)
}
