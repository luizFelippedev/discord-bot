import { Collection } from 'discord.js';
import { UserRepository } from '../database/repositories/userRepository.js';
import type { IUser } from '../database/models/User.js';

export interface LevelUpResult {
  leveledUp: boolean;
  user: IUser;
  xpGained: number;
  newLevel: number;
}

const XP_COOLDOWN_MS = 60 * 1000;

export class LevelingService {
  private readonly userRepository = new UserRepository();
  private readonly cooldowns = new Collection<string, number>();

  public async rewardForMessage(guildId: string, userId: string, amount = 15): Promise<LevelUpResult | null> {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    const lastClaim = this.cooldowns.get(key);

    if (lastClaim && now - lastClaim < XP_COOLDOWN_MS) {
      return null;
    }

    this.cooldowns.set(key, now);

    const user = await this.userRepository.findOrCreate(guildId, userId);
    user.xp += amount;

    const required = this.requiredXp(user.level);
    let leveledUp = false;

    if (user.xp >= required) {
      user.level += 1;
      user.xp -= required;
      leveledUp = true;
    }

    await user.save();

    return { leveledUp, user, xpGained: amount, newLevel: user.level };
  }

  public async getLeaderboard(guildId: string, limit = 10): Promise<IUser[]> {
    return this.userRepository.topBy('level', guildId, limit);
  }

  public requiredXp(level: number): number {
    return 5 * level * level + 50 * level + 100;
  }

  public async getProfile(guildId: string, userId: string): Promise<IUser> {
    return this.userRepository.findOrCreate(guildId, userId);
  }
}
