import { Schema, model, type Document, type Model } from 'mongoose';

export type TransactionType = 'daily' | 'work' | 'bet' | 'purchase' | 'gift' | 'admin';

export interface EconomyTransactionData {
  guildId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  metadata: Record<string, unknown>;
}

export interface IEconomyTransaction extends EconomyTransactionData, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type EconomyTransactionCreateData = EconomyTransactionData;

const EconomyTransactionSchema = new Schema<IEconomyTransaction>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['daily', 'work', 'bet', 'purchase', 'gift', 'admin'],
      required: true
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const EconomyTransactionModel: Model<IEconomyTransaction> = model('EconomyTransaction', EconomyTransactionSchema);
