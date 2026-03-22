import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Device from '@/lib/models/Device'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const query: Record<string, string> = {}
    if (status) query.status = status
    if (type) query.type = type
    const devices = await Device.find(query).lean()
    return NextResponse.json({ devices, total: devices.length })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}
