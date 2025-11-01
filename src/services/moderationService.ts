import { Collection, type GuildMember, type GuildTextBasedChannel, type Message } from 'discord.js';
import { WarningRepository } from '../database/repositories/warningRepository.js';
import type { GuildConfig } from '../database/models/Guild.js';
import type { Logger } from 'winston';

export type ModerationAction = 'warn' | 'mute' | 'ban' | 'kick' | 'delete';

interface ModerationResult {
  violated: boolean;
  reason?: string;
  action?: ModerationAction;
}

const PROFANITY_LIST = ['idiota', 'merda', 'droga', 'palavrão'];

export class ModerationService {
  private readonly warningRepository = new WarningRepository();
  private readonly messageCache = new Collection<string, number[]>();

  constructor(private readonly logger: Logger) {}

  public analyzeMessage(message: Message, config: GuildConfig): ModerationResult {
    if (!config.moderation) return { violated: false };
    if (message.author.bot) return { violated: false };

    const content = message.content.toLowerCase();

    if (config.moderation.profanityFilter && PROFANITY_LIST.some((word) => content.includes(word))) {
      return { violated: true, action: 'warn', reason: 'Uso de palavras impróprias.' };
    }

    if (config.moderation.antiLinks && /(https?:\/\/|discord\.gg)/i.test(content)) {
      return { violated: true, action: 'delete', reason: 'Links não permitidos.' };
    }

    if (config.moderation.antiCaps && this.isExcessiveCaps(message.content)) {
      return { violated: true, action: 'warn', reason: 'Uso excessivo de caps lock.' };
    }

    if (config.moderation.antiSpam && this.isSpam(message)) {
      return { violated: true, action: 'mute', reason: 'Envio de mensagens em excesso.' };
    }

    return { violated: false };
  }

  public async issueWarning(guildId: string, moderatorId: string, userId: string, reason: string) {
    await this.warningRepository.addWarning({
      guildId,
      moderatorId,
      userId,
      reason
    } as never);
  }

  public async getWarnings(guildId: string, userId: string) {
    return this.warningRepository.findWarnings(guildId, userId);
  }

  public async escalate(member: GuildMember, action: ModerationAction, reason: string): Promise<void> {
    switch (action) {
      case 'ban':
        await member.ban({ reason });
        break;
      case 'kick':
        await member.kick(reason);
        break;
      case 'mute': {
        const muteRole = member.guild.roles.cache.find((role) => role.name.toLowerCase().includes('mute'));
        if (muteRole) {
          await member.roles.add(muteRole, reason);
        }
        break;
      }
      case 'warn':
        await member.send(`Você recebeu um aviso no servidor **${member.guild.name}**. Motivo: ${reason}`);
        break;
      default:
        break;
    }
  }

  public async log(channel: GuildTextBasedChannel | null, message: string) {
    if (!channel) return;
    await channel.send({ content: message });
  }

  private isExcessiveCaps(content: string): boolean {
    if (content.length < 10) return false;
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 10) return false;
    const upper = letters.replace(/[^A-Z]/g, '');
    return upper.length / letters.length > 0.7;
  }

  private isSpam(message: Message): boolean {
    const key = `${message.guildId}:${message.author.id}`;
    const now = Date.now();
    const timestamps = this.messageCache.get(key) ?? [];

    timestamps.push(now);
    this.messageCache.set(key, timestamps.filter((timestamp) => now - timestamp < 5_000));

    return (this.messageCache.get(key)?.length ?? 0) > 5;
  }
}
