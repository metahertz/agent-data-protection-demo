import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ConfigBackup from '@/lib/models/ConfigBackup'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const query: Record<string, string> = {}
    if (deviceId) query.device_id = deviceId
    const backups = await ConfigBackup.find(query).sort({ backup_time: -1 }).limit(limit).lean()
    return NextResponse.json({ backups })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config backups' }, { status: 500 })
  }
}
