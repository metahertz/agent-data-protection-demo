import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export async function POST() {
  try {
    const counts = await seedDatabase()
    return NextResponse.json({ success: true, counts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Seed failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
