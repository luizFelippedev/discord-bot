import { VoiceRecordModel, type IVoiceRecord } from '../models/VoiceRecord.js';

export class VoiceRecordRepository {
  public async create(record: Partial<IVoiceRecord>): Promise<IVoiceRecord> {
    return VoiceRecordModel.create(record);
  }

  public async findByGuild(guildId: string, limit = 20): Promise<IVoiceRecord[]> {
    return VoiceRecordModel.find({ guildId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  public async findById(id: string): Promise<IVoiceRecord | null> {
    return VoiceRecordModel.findById(id).exec();
  }
}
