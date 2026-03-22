import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Telemetry from '@/lib/models/Telemetry'

function jitter(base: number, range: number): number {
  return Math.min(100, Math.max(0, base + (Math.random() - 0.5) * 2 * range))
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    const query: Record<string, string> = {}
    if (deviceId) query.device_id = deviceId

    const telemetry = await Telemetry.find(query).lean()

    // Add live jitter to simulate polling
    const withJitter = telemetry.map(t => ({
      ...t,
      cpu_percent: t.cpu_percent > 0 ? Math.round(jitter(t.cpu_percent, 3)) : 0,
      memory_percent: t.memory_percent > 0 ? Math.round(jitter(t.memory_percent, 2)) : 0,
    }))

    return NextResponse.json({ telemetry: withJitter })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 })
  }
}
