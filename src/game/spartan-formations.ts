import type { Fighter } from './battle.ts'
import { SPARTAN, SPARTAN_BASH, SPARTAN_KNIFE, SPARTAN_FORMATION as F, SPARTAN_CHARGE as CHARGE, SPARTAN_COMMANDER } from './spartan.ts'
import { line, poly, type C } from './art.ts'
import type { Team } from './units.ts'

export type FormationKind = 'wall' | 'wedge' | 'circle' | 'arrow'
export interface SpartanArmy { total: number; chargeUsed: boolean; commander?: Fighter }
export interface SpartanSlot {
  x: number; y: number; nx: number; ny: number
  role: 'front' | 'rear' | 'tip' | 'guard' | 'center'
}
export interface SpartanFormation {
  kind: FormationKind
  team: Team
  roster: Fighter[]
  members: Fighter[]
  slots: Map<Fighter, SpartanSlot>
  x: number; y: number; nx: number; ny: number
  hold: number; bashReady: number
  spread: boolean; formed: boolean
  target: Fighter | null
  chargeUsed: boolean
  charge: { phase: 'rally' | 'windup' | 'dash' | 'recover'; total: number; time: number; edge: boolean; screamed: boolean; hits: Set<Fighter> } | null
}

function available(f: Fighter) {
  return chargeAvailable(f) && f.stun <= 0 && f.frozen <= 0 && f.fear <= 0
}

function chargeAvailable(f: Fighter) {
  // The summoned formation carries its members together despite individual status effects.
  return f.species === 'spartan' && f.hp > 0 && !f.zombie
    && !f.lure && !f.taunt && !f.heldBy && !f.thrown && !f.inside
    && !f.tower && !f.falling && f.elevation <= 0
}

export function activeSpartanSlot(f: Fighter) {
  const group = f.spartanFormation, slot = group?.slots.get(f)
  return group && group.formed && (group.members.length >= F.min || group.charge) && slot && available(f)
    && Math.hypot(f.x - slot.x, f.y - slot.y) <= F.settle ? slot : null
}

export function leaveSpartanFormation(f: Fighter) {
  const group = f.spartanFormation
  f.spartanFormation = null
  if (!group) return
  group.members = group.members.filter((member) => member !== f)
  group.slots.delete(f)
  if (group.members.length < F.min && !group.charge) {
    for (const member of group.members) member.spartanFormation = null
    group.members = []
    group.slots.clear()
    group.formed = false
  }
}

function aimSpartanCharge(group: SpartanFormation, enemies: Fighter[]) {
  // Sample straight lanes once; the charge never follows an individual target.
  let score = -1, nearest = Infinity
  const lane = Math.max(CHARGE.lane, Math.ceil(Math.sqrt(group.members.length / 2)) * F.spacing)
  for (let i = 0; i < 48; i++) {
    const angle = i * Math.PI * 2 / 48, nx = Math.cos(angle), ny = Math.sin(angle)
    let count = 0, distance = 0
    for (const f of enemies) {
      const dx = f.x - group.x, dy = f.y - group.y, forward = dx * nx + dy * ny
      if (forward > 0 && Math.abs(dx * ny - dy * nx) <= lane) {
        count++; distance += forward
      }
    }
    if (count > score || count === score && distance < nearest) {
      score = count; nearest = distance; group.nx = nx; group.ny = ny
    }
  }
}

export function updateSpartanFormations(
  fighters: Fighter[], groups: SpartanFormation[], dt: number, width: number, height: number,
  enemyOf: (owner: Fighter, other: Fighter) => boolean,
  definition: (fighter: Fighter) => { hp: number; radius: number },
  armies: Map<Team, SpartanArmy>,
) {
  const ready = fighters.filter(available), assigned = new Set<Fighter>()
  for (const team of ['red', 'blue', 'ffa'] as const) {
    const survivors = fighters.filter((f) => f.species === 'spartan' && f.hp > 0 && !f.zombie && f.team === team)
    if (!survivors.length) { armies.delete(team); continue }
    const regulars = survivors.filter((f) => !f.spartanCommander)
    const army = armies.get(team) ?? { total: regulars.length, chargeUsed: false }
    army.total = Math.max(army.total, regulars.length)
    armies.set(team, army)
    const shared = groups.find((g) => g.team === team && g.charge)
    if (shared?.charge && (shared.charge.phase === 'rally' || shared.charge.phase === 'windup')) {
      for (const f of survivors) if (f.spartanFormation !== shared) leaveSpartanFormation(f)
      shared.roster = [...survivors]; shared.charge.total = army.total
      groups = groups.filter((g) => g.team !== team || g === shared)
    }
    if (army.chargeUsed || !regulars.length || regulars.length > army.total * CHARGE.survivors) continue
    const members = survivors.filter(chargeAvailable).sort((a, b) => Number(!!b.spartanCommander) - Number(!!a.spartanCommander) || a.id - b.id)
    if (!members.length) continue
    const enemies = fighters.filter((f) => !f.nest && !f.colony && !f.species.endsWith('-egg')
      && members.some((member) => enemyOf(member, f)))
    if (!enemies.length) continue
    const x = members.reduce((sum, f) => sum + f.x, 0) / members.length
    const y = members.reduce((sum, f) => sum + f.y, 0) / members.length
    const group: SpartanFormation = { kind: 'arrow', team, roster: [...survivors], members,
      slots: new Map(), x, y, nx: members[0].facing, ny: 0, hold: 0, bashReady: 0,
      spread: false, formed: false, target: null, chargeUsed: true,
      charge: { phase: 'rally', total: army.total, time: CHARGE.rally, edge: false, screamed: false, hits: new Set() } }
    aimSpartanCharge(group, enemies)
    for (const f of survivors) leaveSpartanFormation(f)
    groups = [...groups.filter((g) => g.team !== team), group]
    army.chargeUsed = true
  }
  const active: SpartanFormation[] = []
  for (const group of groups) {
    const survivors = group.roster.filter((f) => f.hp > 0 && !f.zombie && f.team === group.team)
    if (!survivors.length) continue
    group.members = survivors.filter((f) => (group.charge ? chargeAvailable(f) : available(f)) && !assigned.has(f)
      && (group.charge || Math.hypot(f.x - group.x, f.y - group.y) <= F.leash))
    for (const f of ready) {
      if (group.members.length >= F.max || group.chargeUsed) break
      if (f.team === group.team && !assigned.has(f) && !group.roster.includes(f) && !f.spartanFormation
        && Math.hypot(f.x - group.x, f.y - group.y) <= F.join) {
        group.members.push(f)
      }
    }
    if (!group.charge) {
      if (group.members.length < F.min) continue
      group.roster = [...group.members]
    }
    group.members.sort((a, b) => Number(!!b.spartanCommander) - Number(!!a.spartanCommander) || a.id - b.id)
    // A shared charge reserves every survivor, including those recovering from status effects.
    for (const f of group.charge ? survivors : group.members) assigned.add(f)
    active.push(group)
  }
  for (const f of fighters) if (!assigned.has(f)) f.spartanFormation = null
  for (const seed of ready) {
    if (assigned.has(seed)) continue
    const nearby = ready.filter((f) => !assigned.has(f) && f.team === seed.team
      && Math.hypot(f.x - seed.x, f.y - seed.y) <= F.join)
    if (nearby.length < F.min) continue
    let size = Math.min(F.max, nearby.length)
    if (nearby.length > size && nearby.length - size < F.min) size = nearby.length - F.min
    const members = nearby.slice(0, size).sort((a, b) => Number(!!b.spartanCommander) - Number(!!a.spartanCommander) || a.id - b.id)
    const x = members.reduce((sum, f) => sum + f.x, 0) / size
    const y = members.reduce((sum, f) => sum + f.y, 0) / size
    const group: SpartanFormation = { kind: 'wall', team: seed.team, roster: [...members], members, slots: new Map(), x, y,
      nx: seed.facing, ny: 0, hold: 0, bashReady: 0, spread: false, formed: false, target: null,
      chargeUsed: false, charge: null }
    for (const f of members) assigned.add(f)
    active.push(group)
  }

  for (const group of active) {
    for (const member of group.roster) {
      if (member.hp > 0 && !member.zombie && member.team === group.team) member.spartanFormation = group
    }
    const leader = group.members[0]
    if (!leader) { group.formed = false; group.slots.clear(); continue }
    const survivors = group.roster.filter((f) => f.hp > 0 && !f.zombie && f.team === group.team)
    if (group.charge?.phase === 'recover') {
      group.charge.time = Math.max(0, group.charge.time - dt)
      if (group.charge.time === 0) {
        group.charge = null; group.kind = 'wall'; group.formed = false
        for (const member of group.roster) if (member.spartanFormation === group) member.spartanFormation = null
        group.members = []; group.slots.clear(); continue
      }
    } else if (group.charge?.edge) {
      group.charge.phase = 'recover'; group.charge.time = CHARGE.recover
    }
    if (!group.charge && group.members.length < F.min) {
      for (const member of group.roster) if (member.spartanFormation === group) member.spartanFormation = null
      group.formed = false; group.target = null; group.slots.clear(); continue
    }
    group.hold = Math.max(0, group.hold - dt)
    group.bashReady = Math.max(0, group.bashReady - dt)
    const enemies = fighters.filter((f) => enemyOf(leader, f)
      && Math.hypot(f.x - group.x, f.y - group.y) <= F.threat)
    const creatures = enemies.filter((f) => !f.nest && !f.colony && !f.species.endsWith('-egg'))
    const targets = creatures.length ? creatures : enemies
    const retaliation = group.members.map((f) => f.retaliation).find((f) => f && targets.includes(f))
    const nearest = targets.reduce<Fighter | null>((best, f) => !best
      || Math.hypot(f.x - group.x, f.y - group.y) < Math.hypot(best.x - group.x, best.y - group.y) ? f : best, null)
    if (!group.charge && (!group.target || !targets.includes(group.target) || group.hold <= 0)) group.target = retaliation ?? nearest
    const target = group.target
    group.spread = !group.charge && creatures.some((f) => !f.zombie && (f.species === 'phoenix' || f.species === 'dragon'))
    const maxHealth = SPARTAN.hp * group.members.reduce((sum, f) => sum + (f.spartanCommander ? SPARTAN_COMMANDER.power : 1), 0)
    const health = group.members.reduce((sum, f) => sum + f.hp, 0) / maxHealth
    const sides = new Set(creatures.map((f) => Math.floor((Math.atan2(f.y - group.y, f.x - group.x) + Math.PI) / (Math.PI / 2)) % 4))
    const surrounded = sides.size >= 3 || creatures.length > group.members.length * 1.25
    const isolated = target && creatures.filter((f) => f !== target && Math.hypot(f.x - target.x, f.y - target.y) < 120).length < 2
    const wounded = target && target.hp < definition(target).hp * 0.4
    const ranged = target && ['thor', 'ninja', 'siren'].includes(target.species)
    const next: FormationKind = health < F.lowHealth || surrounded ? 'circle'
      : health > F.chargeHealth && target && (wounded || isolated && (creatures.length === 1 || ranged)) ? 'wedge' : 'wall'
    if (!group.charge && group.hold <= 0) { group.kind = next; group.hold = F.hold }
    // Keep each squad aligned with its shared target; circles face outward.
    if (!group.charge && target && group.kind !== 'circle') {
      const dx = target.x - group.x, dy = target.y - group.y, distance = Math.hypot(dx, dy)
      if (distance > 1) { group.nx = dx / distance; group.ny = dy / distance }
    }
    const hasCommander = group.members.some((f) => f.spartanCommander)
    const formationScale = hasCommander ? SPARTAN_COMMANDER.scale : 1
    const size = SPARTAN.size * formationScale, radius = SPARTAN.radius * formationScale
    const spacing = (group.spread ? F.fireSpacing : F.spacing) * (hasCommander ? 1.2 : 1)
    const offsets = new Map<Fighter, { forward: number; side: number; role: SpartanSlot['role']; angle?: number }>()
    if (group.charge) {
      group.kind = 'arrow'; group.target = null; group.spread = false
      const arm = Math.max(1, Math.ceil(Math.sqrt(group.members.length / 2))), seats = arm * 2 - 1
      group.members.forEach((f, i) => {
        const seat = i % seats, depth = Math.floor(i / seats), row = Math.ceil(seat / 2)
        offsets.set(f, { forward: -(row + depth) * spacing,
          side: seat === 0 ? 0 : row * spacing * (seat % 2 ? -1 : 1),
          role: i === 0 ? 'tip' : 'rear' })
      })
      const middle = [...offsets.values()].reduce((sum, p) => sum + p.forward, 0) / offsets.size
      for (const p of offsets.values()) p.forward -= middle
      if (group.charge.phase === 'rally') {
        group.charge.time = Math.max(0, group.charge.time - dt)
        if (group.charge.time === 0 || group.formed && group.members.length === survivors.length) {
          group.charge.phase = 'windup'; group.charge.time = CHARGE.windup
        }
      } else if (group.charge.phase === 'windup') {
        // Summoning belongs to the army; one soldier cannot restart its shared timer.
        group.charge.time = Math.max(0, group.charge.time - dt)
        if (group.charge.time === 0) { group.charge.phase = 'dash'; group.charge.time = 0 }
      }
      if (group.charge.phase === 'dash') {
        group.charge.time += dt
        group.x += group.nx * CHARGE.speed * dt; group.y += group.ny * CHARGE.speed * dt
      }
    } else if (group.kind === 'wall') {
      const columns = Math.ceil(group.members.length / 2)
      group.members.forEach((f, i) => {
        const front = i < columns, count = front ? columns : group.members.length - columns
        offsets.set(f, { forward: (front ? 0.5 : -0.5) * spacing,
          side: (i % columns - (count - 1) / 2) * spacing, role: front ? 'front' : 'rear' })
      })
    } else if (group.kind === 'wedge') {
      let index = 0
      for (let row = 0; index < group.members.length; row++) {
        const count = Math.min(row + 1, group.members.length - index)
        for (let seat = 0; seat < count; seat++) {
          offsets.set(group.members[index++], { forward: -row * spacing * 0.85,
            side: (seat - (count - 1) / 2) * spacing, role: row === 0 ? 'tip' : 'rear' })
        }
      }
      const middle = [...offsets.values()].reduce((sum, p) => sum + p.forward, 0) / offsets.size
      for (const p of offsets.values()) p.forward -= middle
    } else {
      const injured = group.members.filter((f) => f.hp < SPARTAN.hp * (f.spartanCommander ? SPARTAN_COMMANDER.power : 1) * F.lowHealth)
        .sort((a, b) => a.hp - b.hp).slice(0, Math.floor(group.members.length / 3))
      const guards = group.members.filter((f) => !injured.includes(f))
      const radius = Math.max(spacing * (injured.length ? 1.8 : 1), guards.length * spacing / (Math.PI * 2))
      guards.forEach((f, i) => {
        const angle = i * Math.PI * 2 / guards.length
        offsets.set(f, { forward: Math.cos(angle) * radius, side: Math.sin(angle) * radius, role: 'guard', angle })
      })
      const columns = Math.max(1, Math.min(2, injured.length))
      injured.forEach((f, i) => offsets.set(f, {
        forward: (Math.floor(i / columns) - (Math.ceil(injured.length / columns) - 1) / 2) * F.spacing,
        side: (i % columns - (columns - 1) / 2) * F.spacing, role: 'center' }))
    }
    const front = Math.max(...[...offsets.values()].map((p) => p.forward))
    const sentries = group.members.filter((f) => f.spartanSpear || !f.spartanMark)
    const assembled = sentries.length > 0 && sentries.filter((f) => {
      const slot = group.slots.get(f)
      return slot && Math.hypot(f.x - slot.x, f.y - slot.y) <= F.settle * 2
    }).length >= Math.min(F.min, sentries.length)
    if (!group.charge && target && group.kind !== 'circle' && assembled) {
      const distance = Math.hypot(target.x - group.x, target.y - group.y)
      const frontRange = group.members.some((f) => f.spartanSpear) ? SPARTAN.range : SPARTAN_KNIFE.range
      const stop = front + SPARTAN.radius + definition(target).radius
        + (group.kind === 'wall' ? frontRange * 0.65 : SPARTAN_BASH.range * 0.7)
      const speed = SPARTAN.speed * (group.kind === 'wall' ? F.wallSpeed : F.wedgeSpeed)
      const advance = Math.min(Math.max(0, distance - stop), speed * dt)
      group.x += group.nx * advance; group.y += group.ny * advance
    }
    if (group.charge) {
      const projected = [...offsets.values()].map((p) => ({
        x: group.nx * p.forward - group.ny * p.side, y: group.ny * p.forward + group.nx * p.side,
      }))
      const spanX = Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x))
      const spanY = Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y))
      const fit = Math.max(0, Math.min(1, (width - 48 * size) / Math.max(1, spanX),
        (height - 53 * size + radius) / Math.max(1, spanY)))
      for (const p of offsets.values()) { p.forward *= fit; p.side *= fit }
    }
    const points = [...offsets.values()].map((p) => ({ x: group.nx * p.forward - group.ny * p.side,
      y: group.ny * p.forward + group.nx * p.side }))
    const margin = 24 * size, top = 41 * size - radius
    const minX = margin - Math.min(...points.map((p) => p.x)), maxX = width - margin - Math.max(...points.map((p) => p.x))
    const minY = top - Math.min(...points.map((p) => p.y)), maxY = height - 12 * size - Math.max(...points.map((p) => p.y))
    const x = group.x, y = group.y
    group.x = minX <= maxX ? Math.max(minX, Math.min(maxX, x)) : width / 2
    group.y = minY <= maxY ? Math.max(minY, Math.min(maxY, y)) : height / 2
    if (group.charge?.phase === 'dash' && (Math.abs(x - group.x) > 0.001 || Math.abs(y - group.y) > 0.001)) {
      group.charge.edge = true
    }
    group.slots.clear()
    for (const [f, p] of offsets) {
      const angle = p.angle === undefined ? 0 : p.angle
      const nx = group.nx * Math.cos(angle) - group.ny * Math.sin(angle)
      const ny = group.ny * Math.cos(angle) + group.nx * Math.sin(angle)
      group.slots.set(f, {
        x: Math.max(margin, Math.min(width - margin, group.x + group.nx * p.forward - group.ny * p.side)),
        y: Math.max(top, Math.min(height - 12 * size, group.y + group.ny * p.forward + group.nx * p.side)),
        nx, ny, role: p.role,
      })
    }
    group.formed = group.members.filter((f) => {
      const slot = group.slots.get(f)!
      return Math.hypot(f.x - slot.x, f.y - slot.y) <= F.settle
    }).length >= (group.charge ? group.members.length : F.min)
  }
  return active.filter((group) => group.members.length > 0 || group.charge)
}

export function spartanChargeAuraBounds(group: SpartanFormation) {
  let minForward = Infinity, maxForward = -Infinity, minSide = Infinity, maxSide = -Infinity
  let bottom = -Infinity
  const originY = group.y - 16 * SPARTAN.size
  // Include both current and intended positions so the aura also encloses the rally.
  for (const member of group.members) {
    const size = SPARTAN.size * (member.spartanCommander ? SPARTAN_COMMANDER.scale : 1)
    const slot = group.slots.get(member)
    for (const point of slot ? [member, slot] : [member]) {
      bottom = Math.max(bottom, point.y + 12 * size)
      for (const x of [-28, 28]) for (const y of [-30, 30]) {
        const dx = point.x - group.x + x * size
        const dy = point.y - 16 * size - originY + y * size
        const forward = dx * group.nx + dy * group.ny, side = -dx * group.ny + dy * group.nx
        minForward = Math.min(minForward, forward); maxForward = Math.max(maxForward, forward)
        minSide = Math.min(minSide, side); maxSide = Math.max(maxSide, side)
      }
    }
  }
  const forward = (minForward + maxForward) / 2, side = (minSide + maxSide) / 2
  // This rectangle fits inside the dragon's broad skull, with an extra 12 px border.
  const scale = Math.max(1.5, ((maxForward - minForward) / 2 + 12) / 30,
    ((maxSide - minSide) / 2 + 12) / 26)
  return { x: group.x + forward * group.nx - side * group.ny,
    y: originY + forward * group.ny + side * group.nx, scale, bottom }
}

export function drawSpartanFormation(c: C, group: SpartanFormation) {
  if (!group.members.length || group.members.length < F.min && !group.charge) return
  c.save()
  c.strokeStyle = group.kind === 'circle' ? '#a57966' : '#c09344'
  c.lineWidth = 1.2
  c.globalAlpha = group.formed ? 0.4 : 0.2
  for (const slot of group.slots.values()) {
    if (slot.role === 'center') continue
    c.beginPath()
    c.moveTo(slot.x - slot.ny * 7, slot.y + slot.nx * 7)
    c.lineTo(slot.x + slot.ny * 7, slot.y - slot.nx * 7)
    c.stroke()
  }
  c.globalAlpha = 0.8
  c.font = '10px system-ui'
  c.textAlign = 'center'
  c.fillStyle = '#9b753b'
  const bottom = Math.max(...[...group.slots.values()].map((slot) => slot.y))
  const label = group.charge ? group.charge.phase === 'rally' ? 'LAST STAND · RALLY'
    : group.charge.phase === 'windup' ? 'DRAGON CHARGE · WINDING UP'
    : group.charge.phase === 'dash' ? 'DRAGON CHARGE!' : 'LAST STAND · RECOVER'
    : group.kind === 'wall' ? 'SHIELD WALL' : group.kind === 'wedge' ? 'SPEAR WEDGE' : 'DEFENSIVE CIRCLE'
  const remaining = group.roster.filter((f) => f.hp > 0 && !f.zombie && !f.spartanCommander && f.team === group.team).length
  const strength = group.charge ? ` · ${remaining}/${group.charge.total} SPARTANS` : ''
  c.fillText(`${label}${strength}${group.spread ? ' · SPREAD' : ''}`, group.x, bottom + 26)
  c.restore()
}

export function drawSpartanCharge(c: C, group: SpartanFormation, tick: number) {
  const charge = group.charge
  if (!charge || !group.members.length) return
  const dashing = charge.phase === 'dash', winding = charge.phase === 'windup'
  const power = winding ? 1 - charge.time / CHARGE.windup : dashing ? 1 : 0.35
  const fade = charge.phase === 'recover' ? charge.time / CHARGE.recover : 1
  const aura = spartanChargeAuraBounds(group)
  c.save()
  c.translate(aura.x, aura.y)
  c.rotate(Math.atan2(group.ny, group.nx))
  c.strokeStyle = '#ffd27a'; c.lineJoin = 'round'; c.lineCap = 'round'
  c.shadowColor = '#ff922e'; c.shadowBlur = 10 + power * 24
  const pulse = 1.025 + Math.sin(tick * 0.25) * 0.025
  const scale = aura.scale * pulse * (1 + power * 0.08)
  c.scale(scale, scale)
  if (dashing) {
    c.strokeStyle = '#f8a640'; c.lineWidth = 1.2
    for (let i = 0; i < 8; i++) {
      const u = (tick * 0.09 + i / 8) % 1, side = (i - 3.5) * 14
      c.globalAlpha = fade * (1 - u) * 0.5
      line(c, -58 - u * 90, side, -98 - u * 90, side)
    }
  }
  const bronze = c.createLinearGradient(-55, -40, 65, 38)
  bronze.addColorStop(0, '#7e302a'); bronze.addColorStop(0.45, '#dc8c31'); bronze.addColorStop(1, '#ffe7a2')
  const horn = c.createLinearGradient(-70, -75, -15, 35)
  horn.addColorStop(0, '#fff4cb'); horn.addColorStop(0.55, '#e3a344'); horn.addColorStop(1, '#7f3a30')

  // Forked horns and cheek spines grow out of the skull instead of a surrounding halo.
  c.globalAlpha = fade * (0.32 + power * 0.22)
  c.strokeStyle = '#ffe1a0'; c.lineWidth = 1.5
  poly(c, horn, -25, -32, -44, -55, -59, -84, -60, -61, -79, -71,
    -66, -48, -45, -28, -35, -20)
  poly(c, horn, -38, 21, -56, 43, -73, 66, -64, 43, -83, 50,
    -64, 24, -49, 10)
  poly(c, '#d88332', -10, -34, -21, -55, -6, -45, 1, -34)
  poly(c, '#e9ad4d', -48, -15, -74, -27, -62, -7, -51, 1)
  poly(c, '#b86b34', -45, 9, -74, 16, -58, 27, -34, 22)

  // This angular skull contains the entire [-30,30] x [-26,26] army enclosure.
  c.globalAlpha = fade * (0.12 + power * 0.12)
  c.strokeStyle = '#ffd27a'; c.lineWidth = 1.8
  poly(c, bronze, -52, -28, -33, -43, -8, -40, 12, -32, 27, -29, 38, -22,
    59, -18, 70, -6, 69, 5, 48, 9, 38, 5, 34, 13, 46, 18, 68, 15,
    60, 30, 38, 38, 10, 40, -16, 36, -40, 29, -56, 34, -49, 13,
    -64, 9, -51, -3, -64, -12, -48, -17)
  c.globalAlpha = fade * (0.6 + power * 0.3)
  c.stroke()

  // Faceted brow, cheek armor and overlapping scale rows leave the army visible below.
  c.shadowBlur = 4 + power * 8
  c.globalAlpha = fade * (0.17 + power * 0.12)
  c.strokeStyle = '#e7b55b'; c.lineWidth = 0.7
  poly(c, '#fff0ae', -33, -39, -8, -36, 9, -28, -7, -17, -26, -23, -43, -20)
  poly(c, '#7b3431', -41, 6, -17, 3, 2, 15, -9, 30, -33, 23, -48, 27)
  poly(c, '#fbd482', 3, -10, 21, -16, 40, -9, 28, 2, 7, 8, -6, 3)
  c.globalAlpha = fade * (0.32 + power * 0.25)
  c.strokeStyle = '#ffda84'; c.lineWidth = 0.85
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -39 + row * 11, y = -17 + col * 13 + row % 2 * 4
      line(c, x - 4, y - 4, x, y + 1, x + 5, y - 5)
    }
  }
  line(c, -47, -25, -29, -32, -12, -29, 2, -23)
  line(c, -43, 19, -24, 26, -7, 24, 5, 17)
  line(c, 30, -23, 43, -14, 60, -12)

  // A heavy, forward-slanting brow frames a white-hot slit eye.
  c.globalAlpha = fade * (0.72 + power * 0.25)
  c.strokeStyle = '#b4602b'; c.lineWidth = 1
  poly(c, '#5c2630', 4, -21, 17, -24, 29, -19, 16, -9, 6, -12)
  c.shadowColor = '#ff6a19'; c.shadowBlur = 12 + power * 18
  poly(c, '#ffb436', 8, -19, 23, -19, 16, -12, 9, -13)
  c.strokeStyle = '#fff8d5'; c.lineWidth = 1.6
  line(c, 16, -19, 15, -13)
  c.strokeStyle = '#ffe4a2'; c.lineWidth = 2
  line(c, 3, -24, 18, -27, 31, -20)
  c.strokeStyle = '#9c4f2c'; c.lineWidth = 1.1
  line(c, 55, -8, 61, -6, 59, -3)

  const jaw = 2 + power * 5 + (winding ? Math.sin(tick * 0.4) * 1.5 : 0)
  c.shadowBlur = 7 + power * 12
  c.globalAlpha = fade * (0.45 + power * 0.25)
  c.strokeStyle = '#ffc86b'; c.lineWidth = 1.3
  poly(c, '#572331', 36, 7, 49, 10, 69, 6, 64, 18 + jaw, 46, 23 + jaw, 33, 15)
  poly(c, bronze, 28, 22, 43, 22 + jaw, 65, 17 + jaw, 58, 30 + jaw,
    35, 37, 15, 32, 4, 24)
  c.strokeStyle = '#fff2c3'; c.lineWidth = 0.65
  c.globalAlpha = fade * (0.7 + power * 0.25)
  for (let i = 0; i < 4; i++) {
    const x = 39 + i * 7, y = i < 2 ? 8 : 7
    poly(c, '#fff1bf', x, y, x + 2.5, y + (i % 2 ? 7 : 10), x + 5, y + 0.5)
  }
  for (let i = 0; i < 3; i++) {
    const x = 41 + i * 7, y = 26 + jaw - i
    poly(c, '#ffe3a0', x, y, x + 1, y - 7, x + 4.5, y - 1)
  }
  c.strokeStyle = '#ffe2a3'; c.lineWidth = 1
  line(c, 22, 30, 36, 33, 54, 29 + jaw)

  // Molten fissures and swept whiskers carry the same energy into the ram trails.
  c.globalAlpha = fade * (0.22 + power * 0.5)
  c.strokeStyle = '#ffe7a4'; c.shadowColor = '#ff7434'; c.shadowBlur = 9 + power * 14
  c.lineWidth = 0.9
  line(c, -27, -33, -23, -22, -15, -19, -19, -10)
  line(c, -35, 18, -23, 13, -17, 17, -4, 13)
  for (const side of [-1, 1]) {
    c.beginPath(); c.moveTo(-39, side * 19)
    c.bezierCurveTo(-60, side * 30, -72, side * 3, -91, side * 18)
    c.bezierCurveTo(-108, side * 30, -122, side * 9, -136, side * (16 + Math.sin(tick * 0.12) * 3))
    c.stroke()
  }
  for (let i = 0; i < 10; i++) {
    const u = (tick * (dashing ? 0.045 : 0.015) + i * 0.137) % 1
    const x = -41 - u * (dashing ? 135 : 65), y = (i % 2 ? -1 : 1) * (26 + i % 4 * 8 + u * 9)
    c.globalAlpha = fade * (1 - u) * (0.2 + power * 0.6)
    poly(c, i % 3 ? '#ffbf58' : '#fff1af', x - 2, y, x + 1, y - 1.3, x + 4, y, x, y + 1.2)
  }
  c.strokeStyle = '#ffe394'; c.shadowBlur = 0
  if (winding || dashing && charge.time < 0.45) {
    for (let i = 0; i < 3; i++) {
      const wave = (tick * 0.035 + i / 3) % 1
      c.globalAlpha = fade * power * (1 - wave)
      c.lineWidth = 1.2
      const x = 76 + wave * 38, spread = 9 + wave * 19
      line(c, x - 4, 12 - spread, x + 5, 12, x - 4, 12 + spread)
    }
  }
  c.restore()
  if (winding) {
    c.save()
    const width = Math.min(180, Math.max(64, aura.scale * 60))
    c.fillStyle = '#7e5338'; c.fillRect(aura.x - width / 2, aura.bottom + 36, width, 4)
    c.fillStyle = '#f2c456'; c.fillRect(aura.x - width / 2, aura.bottom + 36, width * power, 4)
    c.restore()
  }
}
