import { useEffect, useRef, useState } from 'react'
import { Battle, DT, MAX_FIGHTERS, renderBattle, TEAM_COLORS, type Team } from './game/battle.ts'
import { buildSprites, CATEGORIES, CHARACTER_CATEGORIES, CHARACTERS, SPECIES, UNITS, type Category, type Species } from './game/units.ts'
import { buildTowerIcon, buildTreeIcon, buildWaterIcon, TOWER_SPACING, TREE_SPACING, WATER_SPACING } from './game/terrain.ts'
import { createSpartanAudio } from './game/spartan-audio.ts'

const TEAMS = [
  { id: 'red', label: 'Red', key: 'r', color: TEAM_COLORS.red },
  { id: 'blue', label: 'Blue', key: 'b', color: TEAM_COLORS.blue },
  { id: 'ffa', label: 'Free-for-all', key: 'f' },
] as const

type BattleState = 'running' | 'paused'
type TerrainBrush = 'water' | 'tower' | 'tree'
type Brush = Species | TerrainBrush
const CHARACTER_TABS = CATEGORIES.filter((category) => CHARACTERS.some((species) => CHARACTER_CATEGORIES[species] === category))
const EMPTY_COUNTS = { red: 0, blue: 0, ffa: 0, goose: 0, thor: 0, rex: 0, phoenix: 0, dragon: 0, siren: 0, ninja: 0, spartan: 0, cavalry: 0, mantis: 0, zombie: 0, vampire: 0, swordsaint: 0, meiyuanzhi: 0, yanjin: 0, ant: 0, anthill: 0, 'ant-queen': 0, 'ant-tank': 0, 'ant-slasher': 0, 'ant-fly': 0, 'dragon-nest': 0, 'dragon-egg': 0, 'rex-egg': 0, 'mei-fox': 0 }

export default function App() {
  const [team, setTeam] = useState<Team>('ffa')
  const [battleState, setBattleState] = useState<BattleState>('running')
  const [battle] = useState(() => new Battle())
  const [category, setCategory] = useState<Category | 'terrain'>('Animals')
  const [character, setCharacter] = useState<(typeof CHARACTERS)[number]>('goose')
  const [terrain, setTerrain] = useState<TerrainBrush>('water')
  const selected: Brush = category === 'terrain' ? terrain : character
  const [icons, setIcons] = useState<Partial<Record<Brush, string>>>({})
  const [counts, setCounts] = useState(EMPTY_COUNTS)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const teamRef = useRef(team)
  const stateRef = useRef(battleState)
  const selectedRef = useRef(selected)
  const strokeRef = useRef<{ id: number; x: number; y: number } | null>(null)

  useEffect(() => {
    teamRef.current = team
    stateRef.current = battleState
    selectedRef.current = selected
  }, [team, battleState, selected])

  useEffect(() => {
    const canvas = canvasRef.current!
    const c = canvas.getContext('2d')!
    const audio = createSpartanAudio()
    battle.onSpartanScream = audio.scream
    window.addEventListener('pointerdown', audio.unlock)
    window.addEventListener('keydown', audio.unlock)
    const sprites = buildSprites()
    setIcons({
      ...Object.fromEntries(SPECIES.map((species) => [species, sprites[species].ffa.ready.toDataURL()])),
      water: buildWaterIcon().toDataURL(),
      tower: buildTowerIcon().toDataURL(),
      tree: buildTreeIcon().toDataURL(),
    })
    let dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      battle.resize(canvas.clientWidth, canvas.clientHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    const drop = (x: number, y: number) => {
      if (x >= 0 && x <= battle.width && y >= 0 && y <= battle.height) {
        const brush = selectedRef.current
        if (brush === 'water') battle.water.paint(x, y)
        else if (brush === 'tower') battle.placeTower(x, y)
        else if (brush === 'tree') battle.placeTree(x, y)
        else battle.spawn(x, y, teamRef.current, brush)
      }
    }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      canvas.setPointerCapture(event.pointerId)
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left, y = event.clientY - rect.top
      strokeRef.current = { id: event.pointerId, x, y }
      drop(x, y)
    }
    const move = (event: PointerEvent) => {
      const stroke = strokeRef.current
      if (!stroke || stroke.id !== event.pointerId) return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left, y = event.clientY - rect.top
      let dx = x - stroke.x, dy = y - stroke.y, distance = Math.hypot(dx, dy)
      const brush = selectedRef.current
      const spacing = brush === 'water' ? WATER_SPACING : brush === 'tower' ? TOWER_SPACING
        : brush === 'tree' ? TREE_SPACING : UNITS[brush].spacing
      while (distance >= spacing) {
        stroke.x += dx / distance * spacing
        stroke.y += dy / distance * spacing
        drop(stroke.x, stroke.y)
        dx = x - stroke.x; dy = y - stroke.y
        distance = Math.hypot(dx, dy)
      }
    }
    const up = (event: PointerEvent) => {
      if (strokeRef.current?.id === event.pointerId) strokeRef.current = null
    }
    const blur = () => { strokeRef.current = null }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('lostpointercapture', up)
    window.addEventListener('blur', blur)

    let raf = 0, last = performance.now(), accumulator = 0, shown = ''
    const frame = (now: number) => {
      const elapsed = Math.min(0.1, (now - last) / 1000)
      last = now
      audio.setRunning(stateRef.current === 'running')
      if (stateRef.current === 'running') {
        accumulator += elapsed
        while (accumulator >= DT) { battle.step(); accumulator -= DT }
      } else accumulator = 0
      renderBattle(c, battle, sprites, dpr)
      const next = { ...EMPTY_COUNTS }
      for (const fighter of battle.fighters) { next[fighter.team]++; next[fighter.zombie ? 'zombie' : fighter.species]++ }
      const summary = `${next.red},${next.blue},${next.ffa},${SPECIES.map((species) => next[species]).join(',')}`
      if (summary !== shown) { shown = summary; setCounts(next) }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      battle.onSpartanScream = null
      window.removeEventListener('pointerdown', audio.unlock)
      window.removeEventListener('keydown', audio.unlock)
      audio.dispose()
      window.removeEventListener('resize', resize)
      window.removeEventListener('blur', blur)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('lostpointercapture', up)
      strokeRef.current = null
    }
  }, [battle])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLElement &&
        (event.target.isContentEditable || event.target.closest('input, textarea, select'))) return

      const key = event.key.toLowerCase()
      const selectedTeam = TEAMS.find((option) => option.key === key)
      if (selectedTeam) setTeam(selectedTeam.id)
      else if (/^[0-9]$/.test(key) && CHARACTERS[key === '0' ? 9 : Number(key) - 1]) {
        const species = CHARACTERS[key === '0' ? 9 : Number(key) - 1]
        setCharacter(species)
        setCategory(CHARACTER_CATEGORIES[species])
      }
      else if (key === 'w' || key === 't' || key === 'e') {
        setTerrain(key === 'w' ? 'water' : key === 't' ? 'tower' : 'tree')
        setCategory('terrain')
      }
      else if (key === 'p') {
        setBattleState((state) => state === 'running' ? 'paused' : 'running')
      }
    }

    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])

  const total = counts.red + counts.blue + counts.ffa

  return (
    <main>
      <canvas
        ref={canvasRef}
        className="stage"
        tabIndex={0}
        aria-label={selected === 'water'
          ? 'Battlefield. Click or drag to paint water, or press Enter to paint in the centre.'
          : selected === 'tower'
          ? 'Battlefield. Click or drag to place tall towers, or press Enter to place one in the centre.'
          : selected === 'tree'
          ? 'Battlefield. Click or drag to plant trees, or press Enter to plant one in the centre.'
          : `Battlefield. Click or drag to place ${UNITS[selected].name}, or press Enter to place one in the centre.`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.repeat) {
            if (selected === 'water') battle.water.paint(battle.width / 2, battle.height / 2)
            else if (selected === 'tower') battle.placeTower(battle.width / 2, battle.height / 2)
            else if (selected === 'tree') battle.placeTree(battle.width / 2, battle.height / 2)
            else battle.spawn(battle.width / 2, battle.height / 2, team, selected)
          }
        }}
      />
      <h1 className="title">Inkfight</h1>
      {total === 0 && <p className="hint">Pick a fighter, then tap or drag to spawn. Fighters battle automatically. Pause to set up.</p>}

      <div className="actions">
        <div className="teams" role="group" aria-label="Team for new fighters">
          {TEAMS.map((option) => (
            <button
              key={option.id}
              aria-pressed={team === option.id}
              title={`${option.label} (${option.key})`}
              onClick={() => setTeam(option.id)}
            >
              {'color' in option && <i className="dot" style={{ background: option.color }} />}
              {option.label}
            </button>
          ))}
        </div>
        <button onClick={() => {
          strokeRef.current = null
          battle.clear()
          setCounts(EMPTY_COUNTS)
          setBattleState('running')
        }}>Clear</button>
        <button
          aria-pressed={battleState === 'paused'}
          onClick={() => setBattleState(battleState === 'running' ? 'paused' : 'running')}
        >
          {battleState === 'paused' ? 'Play' : 'Pause'}
        </button>
      </div>

      {total > 0 && (
        <ul className="tally" aria-label="Fighters on the page">
          <li><b>{total}</b> fighter{total === 1 ? '' : 's'}{total === MAX_FIGHTERS ? ' (limit reached)' : ''}</li>
          {SPECIES.map((species) => counts[species] > 0 && (
            <li key={species}>
              {icons[species] && <img src={icons[species]} alt="" />}
              <b>{counts[species]}</b> {UNITS[species].name}
            </li>
          ))}
          {TEAMS.map((option) => counts[option.id] > 0 && (
            <li key={option.id}>
              {'color' in option && <i className="dot" style={{ background: option.color }} />}
              <b>{counts[option.id]}</b> {option.label}
            </li>
          ))}
        </ul>
      )}

      <nav className="tray" aria-label="Characters and terrain">
        <div className="categories" role="group" aria-label="Category">
          {CHARACTER_TABS.map((tab) => (
            <button key={tab} aria-pressed={category === tab} onClick={() => {
              setCategory(tab)
              if (CHARACTER_CATEGORIES[character] !== tab) {
                const first = CHARACTERS.find((species) => CHARACTER_CATEGORIES[species] === tab)
                if (first) setCharacter(first)
              }
            }}>{tab}</button>
          ))}
          <button aria-pressed={category === 'terrain'} onClick={() => setCategory('terrain')}>Terrain</button>
        </div>
        <div className="tray-items" role="group" aria-label={category === 'terrain' ? 'Terrain' : `${category} characters`}>
          {category !== 'terrain' ? CHARACTERS.filter((species) => CHARACTER_CATEGORIES[species] === category).map((species) => (
            <button
              key={species}
              className="fighter"
              aria-pressed={selected === species}
              title={`${UNITS[species].blurb}${CHARACTERS.indexOf(species) < 10 ? ` (${(CHARACTERS.indexOf(species) + 1) % 10})` : ''}`}
              onClick={() => { setCharacter(species); canvasRef.current?.focus() }}
            >
              {icons[species] && <img src={icons[species]} alt="" />}
              <span>{UNITS[species].name}</span>
            </button>
          )) : (
            <>
              <button
                className="fighter"
                aria-pressed={selected === 'water'}
                title="Paint water. Land fighters wade at half speed; Coral Chorus stays in water (W)"
                onClick={() => { setTerrain('water'); canvasRef.current?.focus() }}
              >
                {icons.water && <img src={icons.water} alt="" />}
                <span>Water</span>
              </button>
              <button
                className="fighter"
                aria-pressed={selected === 'tower'}
                title="One-person tower: Thor summons lightning; Ninja throws shuriken. Ground enemies break it; flyers attack its occupant (T)"
                onClick={() => { setTerrain('tower'); canvasRef.current?.focus() }}
              >
                {icons.tower && <img src={icons.tower} alt="" />}
                <span>Tower</span>
              </button>
              <button
                className="fighter"
                aria-pressed={selected === 'tree'}
                title="One Ninja per tree. After a slash, Ninja must recover for 2 seconds and get close before backflipping into cover (E)"
                onClick={() => { setTerrain('tree'); canvasRef.current?.focus() }}
              >
                {icons.tree && <img src={icons.tree} alt="" />}
                <span>Tree</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </main>
  )
}
