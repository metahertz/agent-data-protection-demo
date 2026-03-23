import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

const VIEW_NAME = 'credentials_safe'

export async function GET() {
  try {
    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return NextResponse.json({ viewExists: false })

    const collections = await db.listCollections({ name: VIEW_NAME }).toArray()
    const viewExists = collections.length > 0
    return NextResponse.json({ viewExists })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ viewExists: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action !== 'create' && action !== 'drop') {
      return NextResponse.json({ error: 'action must be "create" or "drop"' }, { status: 400 })
    }

    const conn = await connectDB()
    const db = conn.connection.db
    if (!db) return NextResponse.json({ error: 'Database not connected' }, { status: 503 })

    // Check current state
    const existing = await db.listCollections({ name: VIEW_NAME }).toArray()

    if (action === 'create') {
      if (existing.length > 0) {
        return NextResponse.json({ ok: true, message: 'View already exists' })
      }
      // Create a view that excludes the sensitive credential fields
      await db.createCollection(VIEW_NAME, {
        viewOn: 'credentials',
        pipeline: [
          {
            $project: {
              password: 0,
              enable_password: 0,
              snmp_community: 0,
            },
          },
        ],
      })
      return NextResponse.json({ ok: true, message: `Created MongoDB view "${VIEW_NAME}" — passwords and SNMP strings excluded` })
    }

    // action === 'drop'
    if (existing.length === 0) {
      return NextResponse.json({ ok: true, message: 'View does not exist' })
    }
    await db.dropCollection(VIEW_NAME)
    return NextResponse.json({ ok: true, message: `Dropped view "${VIEW_NAME}"` })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
