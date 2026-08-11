export interface AllocationTarget {
  id: string
  /** true = no capacity ceiling, absorbs whatever finite recruiters can't take */
  unlimited: boolean
  capacity: number | null
  assigned: number
}

/**
 * Splits `count` candidates across recruiters, weighted by remaining
 * headroom (capacity - assigned), preferring recruiters with more room.
 * Unlimited recruiters absorb whatever finite recruiters can't fit.
 *
 * Always returns shares that sum to exactly `count` (when count > 0 and
 * targets is non-empty) — proportional `Math.round` on its own can zero
 * out every share for a small count against a large headroom pool, which
 * would silently drop candidates instead of assigning them to anyone.
 */
export function autoAllocate(count: number, targets: AllocationTarget[]): Record<string, number> {
  const shares: Record<string, number> = Object.fromEntries(targets.map(t => [t.id, 0]))
  if (count <= 0 || !targets.length) return shares

  const finite = targets.filter(t => !t.unlimited)
  const unlimited = targets.filter(t => t.unlimited)
  const finiteHeadroom = new Map(finite.map(t => [t.id, Math.max(0, (t.capacity ?? 0) - t.assigned)]))
  const finiteTotal = [...finiteHeadroom.values()].reduce((s, n) => s + n, 0)

  let remaining = count

  if (finiteTotal > 0) {
    const takeByFinite = Math.min(remaining, finiteTotal)
    const raw = finite.map(t => ({ id: t.id, exact: (finiteHeadroom.get(t.id)! / finiteTotal) * takeByFinite }))
    let allocated = 0
    for (const r of raw) {
      const base = Math.floor(r.exact)
      shares[r.id] = base
      allocated += base
    }
    // Largest-remainder method — give the leftover units (from flooring)
    // to whoever's fractional part was closest to rounding up.
    const leftover = takeByFinite - allocated
    raw.sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)))
    for (let i = 0; i < leftover && raw.length; i++) shares[raw[i % raw.length]!.id]++
    remaining -= takeByFinite
  }

  if (remaining > 0 && unlimited.length) {
    const base = Math.floor(remaining / unlimited.length)
    const rem = remaining - base * unlimited.length
    unlimited.forEach((t, i) => { shares[t.id] += base + (i < rem ? 1 : 0) })
    remaining = 0
  }

  // No unlimited recruiter and headroom is smaller than count — everyone's
  // already full. Rather than lose candidates, spill the rest round-robin
  // across the finite recruiters (they'll exceed capacity, same as the
  // spec's "manual can exceed limits" allowance for admin-driven moves).
  if (remaining > 0 && finite.length) {
    let i = 0
    while (remaining > 0) {
      shares[finite[i % finite.length]!.id]++
      remaining--
      i++
    }
  }

  return shares
}
