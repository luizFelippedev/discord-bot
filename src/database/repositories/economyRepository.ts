import {
  EconomyTransactionModel,
  type EconomyTransactionCreateData,
  type IEconomyTransaction,
  type TransactionType
} from '../models/Economy.js';

export class EconomyRepository {
  public async logTransaction(entry: EconomyTransactionCreateData): Promise<IEconomyTransaction> {
    return EconomyTransactionModel.create(entry);
  }

  public async findRecent(guildId: string, userId: string, limit = 10): Promise<IEconomyTransaction[]> {
    return EconomyTransactionModel.find({ guildId, userId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  public async sumByType(guildId: string, type: TransactionType): Promise<number> {
    const result = await EconomyTransactionModel.aggregate([
      { $match: { guildId, type } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result[0]?.total ?? 0;
  }
}
