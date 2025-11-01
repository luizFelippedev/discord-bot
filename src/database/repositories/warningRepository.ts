import { WarningModel, type IWarning } from '../models/Warning.js';

interface NewWarning {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  expiresAt?: Date;
}

export class WarningRepository {
  public async addWarning(data: NewWarning): Promise<IWarning> {
    return WarningModel.create(data);
  }

  public async findWarnings(guildId: string, userId: string): Promise<IWarning[]> {
    return WarningModel.find({ guildId, userId }).sort({ createdAt: -1 }).exec();
  }

  public async findRecent(guildId: string, limit = 20): Promise<IWarning[]> {
    return WarningModel.find({ guildId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  public async removeWarning(id: string): Promise<void> {
    await WarningModel.findByIdAndDelete(id);
  }
}
