import { NextResponse } from 'next/server'
import { getMongoState, saveMongoState } from '@/lib/db/mongo-state'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json(
      { error: 'Mongo backend disabled' },
      { status: 501 },
    )
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const state = await getMongoState()
    return NextResponse.json(state)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 },
    )
  }
}

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json(
      { error: 'Mongo backend disabled' },
      { status: 501 },
    )
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const state = (await req.json()) as unknown
    await saveMongoState(state as any)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 },
    )
  }
}

