import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import DeviceLog from '@/lib/models/DeviceLog'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const severity = searchParams.get('severity')
    const deviceId = searchParams.get('deviceId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}
    if (severity) query.severity = { $in: severity.split(',') }
    if (deviceId) query.device_id = deviceId
    if (search) query.message = { $regex: search, $options: 'i' }

    const [logs, total] = await Promise.all([
      DeviceLog.find(query).sort({ timestamp: -1 }).skip(offset).limit(limit).lean(),
      DeviceLog.countDocuments(query)
    ])
    return NextResponse.json({ logs, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
