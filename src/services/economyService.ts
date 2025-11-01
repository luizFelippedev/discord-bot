import { randomInt } from 'node:crypto';
import type { IUser } from '../database/models/User.js';
import { EconomyRepository } from '../database/repositories/economyRepository.js';
import { UserRepository } from '../database/repositories/userRepository.js';
import type { Logger } from 'winston';
import type { GuildConfig } from '../database/models/Guild.js';

interface EconomyOperation {
  user: IUser;
  amount: number;
  balance: number;
}

export class EconomyService {
  private readonly userRepository = new UserRepository();
  private readonly economyRepository = new EconomyRepository();

  constructor(private readonly logger: Logger) {}

  public async getBalance(guildId: string, userId: string): Promise<number> {
    const user = await this.userRepository.findOrCreate(guildId, userId);
    return user.coins;
  }

  public async awardDaily(guildId: string, userId: string, config: GuildConfig): Promise<EconomyOperation> {
    const user = await this.userRepository.findOrCreate(guildId, userId);

    if (user.dailyClaimedAt && Date.now() - user.dailyClaimedAt.getTime() < 86_400_000) {
      throw new Error('Você já pegou sua recompensa diária. Volte mais tarde!');
    }

    user.dailyClaimedAt = new Date();
    user.coins += config.economy.dailyReward;
    await user.save();

    await this.economyRepository.logTransaction({
      guildId,
      userId,
      type: 'daily',
      amount: config.economy.dailyReward,
      balanceAfter: user.coins,
      metadata: {}
    });

    return { user, amount: config.economy.dailyReward, balance: user.coins };
  }

  public async work(guildId: string, userId: string, config: GuildConfig): Promise<EconomyOperation> {
    const user = await this.userRepository.findOrCreate(guildId, userId);

    if (user.workCooldownAt && Date.now() - user.workCooldownAt.getTime() < 60 * 60 * 1000) {
      throw new Error('Você já trabalhou recentemente. Tente novamente em 1 hora.');
    }

    const [minReward, maxReward] = config.economy.workRewardRange;
    const reward = randomInt(minReward, maxReward + 1);

    user.workCooldownAt = new Date();
    user.coins += reward;
    await user.save();

    await this.economyRepository.logTransaction({
      guildId,
      userId,
      type: 'work',
      amount: reward,
      balanceAfter: user.coins,
      metadata: {}
    });

    return { user, amount: reward, balance: user.coins };
  }

  public async adjustBalance(guildId: string, userId: string, amount: number, reason: string): Promise<EconomyOperation> {
    const user = await this.userRepository.findOrCreate(guildId, userId);
    user.coins += amount;
    await user.save();

    await this.economyRepository.logTransaction({
      guildId,
      userId,
      type: 'admin',
      amount,
      balanceAfter: user.coins,
      metadata: { reason }
    });

    return { user, amount, balance: user.coins };
  }

  public async leaderboard(guildId: string, limit = 10): Promise<IUser[]> {
    return this.userRepository.topBy('coins', guildId, limit);
  }
}
