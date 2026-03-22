import mongoose, { Schema, Document } from 'mongoose'

export interface IDevice extends Document {
  hostname: string
  type: 'router' | 'switch' | 'access_point'
  ip_address: string
  mac_address: string
  location: string
  rack_unit: string
  firmware_version: string
  serial_number: string
  status: 'online' | 'offline' | 'degraded'
  vendor: string
  model: string
}

const DeviceSchema = new Schema<IDevice>({
  hostname: { type: String, required: true, unique: true },
  type: { type: String, enum: ['router', 'switch', 'access_point'], required: true },
  ip_address: { type: String, required: true, unique: true },
  mac_address: { type: String, required: true, unique: true },
  location: { type: String },
  rack_unit: { type: String },
  firmware_version: { type: String },
  serial_number: { type: String, unique: true },
  status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
  vendor: { type: String },
  model: { type: String },
}, { timestamps: true })

export default mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema)
