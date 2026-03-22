import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IDeviceLog extends Document {
  device_id: Types.ObjectId
  hostname: string
  timestamp: Date
  severity: 'info' | 'warn' | 'error' | 'critical'
  facility: string
  message: string
  raw_syslog: string
}

const DeviceLogSchema = new Schema<IDeviceLog>({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  hostname: { type: String },
  timestamp: { type: Date, required: true, index: true },
  severity: { type: String, enum: ['info', 'warn', 'error', 'critical'], required: true, index: true },
  facility: { type: String },
  message: { type: String, required: true },
  raw_syslog: { type: String },
}, { timestamps: true })

export default mongoose.models.DeviceLog || mongoose.model<IDeviceLog>('DeviceLog', DeviceLogSchema)
