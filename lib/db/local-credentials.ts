const CREDENTIALS_KEY = 'electrotrack_credentials_v1'

type CredentialMap = Record<string, string>

function loadMap(): CredentialMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    return raw ? (JSON.parse(raw) as CredentialMap) : {}
  } catch {
    return {}
  }
}

function saveMap(map: CredentialMap): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(map))
}

export function setLocalCredential(email: string, password: string): void {
  const map = loadMap()
  map[email.trim().toLowerCase()] = password
  saveMap(map)
}

export function verifyLocalCredential(email: string, password: string): boolean {
  const map = loadMap()
  return map[email.trim().toLowerCase()] === password
}

export function removeLocalCredential(email: string): void {
  const map = loadMap()
  delete map[email.trim().toLowerCase()]
  saveMap(map)
}

/** Seed demo passwords for offline testing */
export function ensureDemoCredentials(): void {
  const demos: Record<string, string> = {
    'admin@electrotrack.com': 'admin123',
    'depo@electrotrack.com': 'depo123',
    'distributor@electrotrack.com': 'dist123',
    'subdistributor@electrotrack.com': 'sub123',
    'retailer@electrotrack.com': 'retail123',
    'salesman@electrotrack.com': 'sales123',
  }
  const map = loadMap()
  let changed = false
  for (const [email, password] of Object.entries(demos)) {
    if (!map[email]) {
      map[email] = password
      changed = true
    }
  }
  if (changed) saveMap(map)
}
