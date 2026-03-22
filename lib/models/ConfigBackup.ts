import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IConfigBackup extends Document {
  device_id: Types.ObjectId
  hostname: string
  backup_time: Date
  config_text: string
  size_bytes: number
  triggered_by: 'scheduled' | 'manual' | 'pre-change'
  version_label: string
}

const ConfigBackupSchema = new Schema<IConfigBackup>({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  hostname: { type: String },
  backup_time: { type: Date, required: true },
  config_text: { type: String, required: true },
  size_bytes: { type: Number },
  triggered_by: { type: String, enum: ['scheduled', 'manual', 'pre-change'], default: 'scheduled' },
  version_label: { type: String },
}, { timestamps: true })

export default mongoose.models.ConfigBackup || mongoose.model<IConfigBackup>('ConfigBackup', ConfigBackupSchema)
