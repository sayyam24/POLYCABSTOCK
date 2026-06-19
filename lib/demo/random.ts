/** Mulberry32 seeded PRNG for reproducible demo data */
export function createRng(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function daysAgoIso(rng: () => number, maxDays: number): string {
  const days = intBetween(rng, 0, maxDays)
  const hours = intBetween(rng, 8, 18)
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hours, intBetween(rng, 0, 59), 0, 0)
  return d.toISOString()
}
