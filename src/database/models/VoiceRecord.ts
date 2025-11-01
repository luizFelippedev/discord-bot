import { Schema, model, type Document, type Model } from 'mongoose';

export interface IVoiceRecord extends Document {
  guildId: string;
  channelId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  participants: string[];
  filePath: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceRecordSchema = new Schema<IVoiceRecord>(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    participants: { type: [String], default: [] },
    filePath: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const VoiceRecordModel: Model<IVoiceRecord> = model('VoiceRecord', VoiceRecordSchema);
