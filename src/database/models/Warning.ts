import { Schema, model, type Document, type Model } from 'mongoose';

export interface IWarning extends Document {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WarningSchema = new Schema<IWarning>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

export const WarningModel: Model<IWarning> = model('Warning', WarningSchema);
