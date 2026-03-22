import { connectDB } from '../mongodb'
import Device from '../models/Device'
import Credential from '../models/Credential'
import ConfigBackup from '../models/ConfigBackup'
import DeviceLog from '../models/DeviceLog'
import Telemetry from '../models/Telemetry'
import { deviceSeedData } from './devices'
import { credentialSeedData } from './credentials'
import { configBackupSeedData } from './config-backups'
import { deviceLogSeedData } from './device-logs'
import { telemetrySeedData } from './telemetry'

export async function seedDatabase() {
  await connectDB()

  // Drop all collections
  await Device.deleteMany({})
  await Credential.deleteMany({})
  await ConfigBackup.deleteMany({})
  await DeviceLog.deleteMany({})
  await Telemetry.deleteMany({})

  // Insert devices first
  const devices = await Device.insertMany(deviceSeedData)

  // Build hostname → ObjectId map
  const deviceMap = new Map(devices.map(d => [d.hostname, d._id]))

  // Insert credentials with device_ids resolved
  const credentialsWithIds = credentialSeedData.map(c => ({
    ...c,
    device_id: deviceMap.get(c.hostname)
  }))
  await Credential.insertMany(credentialsWithIds)

  // Insert config backups with device_ids resolved
  const backupsWithIds = configBackupSeedData.map(b => ({
    ...b,
    device_id: deviceMap.get(b.hostname)
  }))
  await ConfigBackup.insertMany(backupsWithIds)

  // Insert logs with device_ids resolved
  const logsWithIds = deviceLogSeedData.map(l => ({
    ...l,
    device_id: deviceMap.get(l.hostname)
  }))
  await DeviceLog.insertMany(logsWithIds)

  // Insert telemetry with device_ids resolved
  const telemetryWithIds = telemetrySeedData.map(t => ({
    ...t,
    device_id: deviceMap.get(t.hostname)
  }))
  await Telemetry.insertMany(telemetryWithIds)

  return {
    devices: devices.length,
    credentials: credentialsWithIds.length,
    configBackups: backupsWithIds.length,
    logs: logsWithIds.length,
    telemetry: telemetryWithIds.length
  }
}
