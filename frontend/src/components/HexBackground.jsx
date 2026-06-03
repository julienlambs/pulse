import { useEffect, useRef } from 'react'

const r     = 38
const w     = r * Math.sqrt(3)
const vStep = r * 1.5
const ns    = 'http://www.w3.org/2000/svg'

function hexPts(cx, cy) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function getProx(cx, cy, centers) {
  let best = 0
  for (const [gx, gy, gr] of centers) {
    const dist = Math.sqrt((cx - gx) ** 2 + (cy - gy) ** 2)
    const p = Math.max(0, 1 - dist / gr)
    if (p > best) best = p
  }
  return best
}

function buildGrid(svgEl, W, H, centers, filterId) {
  const cols = Math.ceil(W / w) + 2
  const rows = Math.ceil(H / vStep) + 2

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx   = col * w + (row % 2 === 1 ? w / 2 : 0)
      const cy   = row * vStep
      const prox = getProx(cx, cy, centers)
      if (prox === 0) continue

      const p = document.createElementNS(ns, 'polygon')
      p.setAttribute('points', hexPts(cx, cy))

      if (prox > 0.55 && Math.random() < prox * 0.18) {
        p.setAttribute('fill',         `rgba(96,80,220,${(prox * 0.07).toFixed(2)})`)
        p.setAttribute('stroke',       `rgba(96,80,220,${(prox * 0.35).toFixed(2)})`)
        p.setAttribute('stroke-width', '0.9')
        p.setAttribute('filter',       `url(#${filterId})`)
      } else {
        p.setAttribute('fill',         'none')
        p.setAttribute('stroke',       `rgba(96,80,220,${(prox * 0.14).toFixed(2)})`)
        p.setAttribute('stroke-width', '0.4')
      }
      svgEl.appendChild(p)
    }
  }
}

function makeSvg(filterId, style) {
  const el = document.createElementNS(ns, 'svg')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = style
  el.innerHTML = `<defs><filter id="${filterId}" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></defs>`
  return el
}

export default function HexBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    let raf = null
    let resizeTimer = null

    function build() {
      const el = containerRef.current
      if (!el) return
      while (el.firstChild) el.removeChild(el.firstChild)

      const W = window.innerWidth
      const H = window.innerHeight

      // 3 centres : haut-droite, bas-gauche, milieu discret
      const gr = W * 0.65
      const centers = [
        [W * 0.78, H * 0.22, gr],
        [W * 0.18, H * 0.75, gr],
        [W * 0.50, H * 0.50, gr * 0.5],
      ]

      const svg = makeSvg(
        'hglow-pulse',
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;'
      )
      buildGrid(svg, W, H, centers, 'hglow-pulse')
      el.appendChild(svg)
    }

    raf = requestAnimationFrame(build)

    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(build, 250)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
