import { useEffect, useMemo, useRef, useState } from 'react'
import { render } from './game/render.ts'
import { DT, Sim } from './game/sim.ts'
import { buildSprites, CATEGORIES, UNITS } from './game/units.ts'

const TABS = [...CATEGORIES, 'Terrain'] as const
type Tab = (typeof TABS)[number]
const BUSH = -1, PUDDLE = -2 // brush ids for the terrain tools; fighters use their UNITS index
const HIDERS = UNITS.filter((u) => u.hides).map((u) => u.name).join(', ')
const brushesIn = (tab: Tab) => (tab === 'Terrain' ? [BUSH, PUDDLE] : UNITS.flatMap((u, i) => (u.category === tab ? [i] : [])))

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sprites = useMemo(buildSprites, [])
  const icons = useMemo(() => sprites.unit.map((s) => s.toDataURL()), [sprites])
  const terrainIcons = useMemo(() => [sprites.bushIcon.toDataURL(), sprites.puddleIcon.toDataURL()], [sprites])
  const sim = useMemo(() => new Sim(), [])
  const [selected, setSelected] = useState(0)
  const [tab, setTab] = useState<Tab>(UNITS[0].category)
  const [paused, setPaused] = useState(false)
  const [counts, setCounts] = useState<number[]>(() => UNITS.map(() => 0))
  const selectedRef = useRef(selected)
  const pausedRef = useRef(paused)
  const tabRef = useRef(tab)
  tabRef.current = tab
  selectedRef.current = selected
  pausedRef.current = paused

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let dpr = 1

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      sim.resize(canvas.clientWidth, canvas.clientHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    // brush: drop a unit (or a bush / puddle) every `spacing` px along the stroke
    let drawing = false, lx = 0, ly = 0
    const drop = (x: number, y: number) => {
      const b = selectedRef.current
      if (b < 0) sim.addTerrain(x, y, -1 - b)
      else sim.spawn(b, x + Math.random() * 8 - 4, y + Math.random() * 8 - 4)
    }
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      drawing = true
      lx = e.offsetX
      ly = e.offsetY
      drop(lx, ly)
    }
    const move = (e: PointerEvent) => {
      if (!drawing) return
      const gap = selectedRef.current < 0 ? 22 : UNITS[selectedRef.current].spacing
      let dx = e.offsetX - lx, dy = e.offsetY - ly, d = Math.hypot(dx, dy)
      while (d >= gap) {
        lx += (dx / d) * gap
        ly += (dy / d) * gap
        drop(lx, ly)
        dx = e.offsetX - lx
        dy = e.offsetY - ly
        d = Math.hypot(dx, dy)
      }
    }
    const up = () => (drawing = false)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    const key = (e: KeyboardEvent) => {
      const n = Number(e.key) // 1-9 picks a brush in the open tab
      const inTab = brushesIn(tabRef.current)
      if (n >= 1 && n <= inTab.length) setSelected(inTab[n - 1])
      else if (e.key === 'p') setPaused((p) => !p)
    }
    window.addEventListener('keydown', key)

    // fixed 60 Hz simulation, rendered every frame with interpolation
    let raf = 0, last = performance.now(), acc = 0, shown = ''
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      if (pausedRef.current) acc = DT
      else while (acc >= DT) { sim.step(); acc -= DT }
      render(ctx, sim, sprites, acc / DT, dpr)
      const now_ = sim.counts.join()
      if (now_ !== shown) { shown = now_; setCounts(Array.from(sim.counts)) }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', key)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [sim, sprites])

  const total = counts.reduce((a, b) => a + b, 0)
  const inTab = brushesIn(tab)

  return (
    <>
      <canvas ref={canvasRef} className="stage" />
      <h1 className="title">Inkfight</h1>
      {total === 0 && <p className="hint">Pick a fighter, then scribble on the page. Different fighters brawl on sight.</p>}

      <div className="actions">
        <button onClick={() => sim.clear()}>Clear</button>
        <button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
      </div>

      {total > 0 && (
        <ul className="tally">
          {UNITS.map((u, i) => counts[i] > 0 && (
            <li key={u.key}><img src={icons[i]} alt="" /><b>{counts[i]}</b> {u.name}</li>
          ))}
        </ul>
      )}

      <nav className="tray" aria-label="Fighters">
        <div className="tabs" role="tablist">
          {TABS.map((c) => (
            <button key={c} role="tab" aria-selected={c === tab} onClick={() => setTab(c)}>{c}</button>
          ))}
        </div>
        <div className="fighters">
          {inTab.length === 0 && <p className="empty">Nothing here yet...</p>}
          {inTab.map((i, n) => {
            const u = UNITS[i], name = i === BUSH ? 'Bush' : i === PUDDLE ? 'Puddle' : u.name
            const tip = i === BUSH ? `Sneaky fighters hide inside and ambush: ${HIDERS}`
              : i === PUDDLE ? 'Soggy socks: everyone but Water fighters wades at half speed'
              : u.blurb + (u.hides ? '. Hides in bushes' : '') + (u.waterbound ? '. Stays in water; brings a puddle when placed on dry paper' : u.category === 'Water' ? '. Glides through puddles' : '')
            return (
              <button key={name} className="fighter" aria-pressed={i === selected} title={`${tip}${n < 9 ? ` (${n + 1})` : ''}`} onClick={() => setSelected(i)}>
                <img src={i < 0 ? terrainIcons[-1 - i] : icons[i]} alt="" />
                <span>{name}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
