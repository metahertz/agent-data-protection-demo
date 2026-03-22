import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITelemetry extends Document {
  device_id: Types.ObjectId
  hostname: string
  polled_at: Date
  cpu_percent: number
  memory_percent: number
  uptime_seconds: number
  temperature_celsius: number | null
  port_count: number
  ports_up: number
  ports_down: number
  tx_bytes: number
  rx_bytes: number
}

const TelemetrySchema = new Schema<ITelemetry>({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true, unique: true },
  hostname: { type: String },
  polled_at: { type: Date, required: true },
  cpu_percent: { type: Number },
  memory_percent: { type: Number },
  uptime_seconds: { type: Number },
  temperature_celsius: { type: Number, default: null },
  port_count: { type: Number },
  ports_up: { type: Number },
  ports_down: { type: Number },
  tx_bytes: { type: Number },
  rx_bytes: { type: Number },
}, { timestamps: true })

export default mongoose.models.Telemetry || mongoose.model<ITelemetry>('Telemetry', TelemetrySchema)
