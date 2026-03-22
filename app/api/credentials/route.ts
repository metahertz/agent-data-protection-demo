import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Credential from '@/lib/models/Credential'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    const query: Record<string, string> = {}
    if (deviceId) query.device_id = deviceId
    const credentials = await Credential.find(query).lean()
    return NextResponse.json({ credentials })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}
