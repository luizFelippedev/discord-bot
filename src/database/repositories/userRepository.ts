import { UserModel, type IUser } from '../models/User.js';

export class UserRepository {
  public async findOrCreate(guildId: string, userId: string, defaults: Partial<IUser> = {}): Promise<IUser> {
    let record = await UserModel.findOne({ guildId, discordId: userId });

    if (!record) {
      record = await UserModel.create({
        guildId,
        discordId: userId,
        username: defaults.username ?? 'Unknown',
        discriminator: defaults.discriminator ?? '0000',
        avatarUrl: defaults.avatarUrl,
        ...defaults
      });
    }

    return record;
  }

  public async update(guildId: string, userId: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findOneAndUpdate({ guildId, discordId: userId }, data, { new: true });
  }

  public async increment(guildId: string, userId: string, increments: Partial<Record<keyof IUser, number>>): Promise<IUser | null> {
    return UserModel.findOneAndUpdate({ guildId, discordId: userId }, { $inc: increments }, { new: true });
  }

  public async topBy(field: keyof IUser, guildId: string, limit = 10): Promise<IUser[]> {
    return UserModel.find({ guildId }).sort({ [field]: -1 }).limit(limit).exec();
  }
}
