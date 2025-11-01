import { GuildModel, type IGuild, type GuildConfig } from '../models/Guild.js';

export class GuildRepository {
  public async findOrCreate(guildId: string, defaults: Partial<IGuild> = {}): Promise<IGuild> {
    let guild = await GuildModel.findOne({ guildId });

    if (!guild) {
      guild = await GuildModel.create({
        guildId,
        name: defaults.name ?? 'Unknown Guild',
        ownerId: defaults.ownerId ?? '0',
        config: defaults.config ?? ({} as GuildConfig),
        iconUrl: defaults.iconUrl
      });
    }

    return guild;
  }

  public async update(guildId: string, data: Partial<IGuild>): Promise<IGuild | null> {
    return GuildModel.findOneAndUpdate({ guildId }, data, { new: true });
  }
}
