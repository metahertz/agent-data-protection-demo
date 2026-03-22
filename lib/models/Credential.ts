import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ICredential extends Document {
  device_id: Types.ObjectId
  hostname: string
  username: string
  password: string  // PLAINTEXT — intentional for demo
  enable_password: string
  snmp_community: string
  ssh_key_fingerprint: string
}

const CredentialSchema = new Schema<ICredential>({
  device_id: { type: Schema.Types.ObjectId, ref: 'Device', required: true, unique: true },
  hostname: { type: String },
  username: { type: String, required: true },
  password: { type: String, required: true },
  enable_password: { type: String },
  snmp_community: { type: String },
  ssh_key_fingerprint: { type: String },
}, { timestamps: true })

export default mongoose.models.Credential || mongoose.model<ICredential>('Credential', CredentialSchema)
