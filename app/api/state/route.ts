import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import type { DatabaseState } from '@/lib/db/local-db'

export async function GET() {
  try {
    const state = await loadServerState()
    return NextResponse.json(state)
  } catch (err) {
    console.error('State API error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { error: errorMessage, details: err instanceof Error ? err.stack : undefined },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const state = (await req.json()) as DatabaseState
    await saveServerState(state)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('State save error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to save data'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    )
  }
}
