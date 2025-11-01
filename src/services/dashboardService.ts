import type { Guild } from 'discord.js';
import { EconomyRepository } from '../database/repositories/economyRepository.js';
import { UserRepository } from '../database/repositories/userRepository.js';
import { VoiceRecordRepository } from '../database/repositories/recordRepository.js';

export interface DashboardOverview {
  memberCount: number;
  onlineMembers: number;
  textChannels: number;
  voiceChannels: number;
  recordings: number;
  totalCoins: number;
}

export class DashboardService {
  private readonly userRepository = new UserRepository();
  private readonly economyRepository = new EconomyRepository();
  private readonly voiceRecordRepository = new VoiceRecordRepository();

  public async getOverview(guild: Guild): Promise<DashboardOverview> {
    const [topUsers, recordings, economy] = await Promise.all([
      this.userRepository.topBy('coins', guild.id, 100),
      this.voiceRecordRepository.findByGuild(guild.id, 10),
      this.economyRepository.sumByType(guild.id, 'daily')
    ]);

    return {
      memberCount: guild.memberCount,
      onlineMembers: guild.members.cache.filter((member) => member.presence?.status === 'online').size,
      textChannels: guild.channels.cache.filter((channel) => channel.isTextBased()).size,
      voiceChannels: guild.channels.cache.filter((channel) => channel.isVoiceBased()).size,
      recordings: recordings.length,
      totalCoins: topUsers.reduce((acc, user) => acc + user.coins, 0) + economy
    };
  }
}
