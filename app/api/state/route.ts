import { NextResponse } from 'next/server'
import { loadServerState, saveServerState, createEmptyDatabaseState } from '@/lib/db/server-state'
import type { DatabaseState } from '@/lib/db/local-db'

export async function GET() {
  try {
    console.log('Attempting to load server state...')
    const state = await loadServerState()
    console.log('Server state loaded successfully')
    return NextResponse.json(state)
  } catch (err) {
    console.error('State API error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
    console.error('Error details:', errorMessage)
    
    // If database is empty, initialize it
    if (errorMessage.includes('Missing MONGODB_URI') || errorMessage.includes('NEXT_PUBLIC_DATA_BACKEND')) {
      return NextResponse.json(
        { error: 'MongoDB not configured properly', details: errorMessage },
        { status: 500 },
      )
    }
    
    // If the database is empty/doesn't have data, initialize it
    if (errorMessage.includes('not found') || errorMessage.includes('empty')) {
      console.log('Database appears empty, initializing...')
      try {
        const emptyState = createEmptyDatabaseState()
        await saveServerState(emptyState)
        console.log('Database initialized with empty state')
        return NextResponse.json(emptyState)
      } catch (initErr) {
        console.error('Failed to initialize database:', initErr)
        return NextResponse.json(
          { error: 'Failed to initialize database', details: initErr instanceof Error ? initErr.message : String(initErr) },
          { status: 500 },
        )
      }
    }
    
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
