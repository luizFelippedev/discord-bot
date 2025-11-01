import type { Presence } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { GuildRepository } from '../database/repositories/guildRepository.js';
import type { Logger } from 'winston';

export class LiveDetectionService {
  private readonly liveUsers = new Set<string>();
  private readonly guildRepository = new GuildRepository();

  constructor(private readonly logger: Logger) {}

  public async handlePresenceUpdate(oldPresence: Presence | null, newPresence: Presence): Promise<void> {
    const wasStreaming = this.isStreaming(oldPresence);
    const isStreamingNow = this.isStreaming(newPresence);
    const guild = newPresence.guild;

    if (!guild || newPresence.user?.bot) return;

    if (!wasStreaming && isStreamingNow) {
      this.liveUsers.add(this.buildKey(guild.id, newPresence.userId!));
      await this.announceLive(guild.id, newPresence);
    } else if (wasStreaming && !isStreamingNow) {
      this.liveUsers.delete(this.buildKey(guild.id, newPresence.userId!));
      await this.endLive(guild.id, newPresence);
    }
  }

  private isStreaming(presence: Presence | null): boolean {
    if (!presence) return false;
    return presence.activities.some((activity) => activity.type === 1);
  }

  private async announceLive(guildId: string, presence: Presence) {
    const guild = presence.guild;
    if (!guild) return;

    const config = await this.guildRepository.findOrCreate(guildId, {
      name: guild.name,
      ownerId: guild.ownerId ?? '0'
    });

    if (!config.config.liveChannel) return;

    const channel = guild.channels.cache.get(config.config.liveChannel);
    if (!channel?.isTextBased()) return;

    const activity = presence.activities.find((act) => act.type === 1);
    if (!activity) return;

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setAuthor({
        name: presence.user?.username ?? 'Streamer',
        iconURL: presence.user?.displayAvatarURL() ?? undefined
      })
      .setTitle('🔴 LIVE COMEÇANDO AGORA!')
      .setDescription(activity.state ?? 'Uma nova live começou!')
      .addFields(
        { name: '🎮 Jogo', value: activity.details ?? 'Não informado', inline: true },
        { name: '👤 Streamer', value: `<@${presence.userId}>`, inline: true }
      )
      .setURL(activity.url ?? 'https://twitch.tv')
      .setTimestamp(new Date());

    await channel.send({ content: '@here Nova live no ar!', embeds: [embed] });
    this.logger.info('Enviada notificação de live para %s', presence.userId);
  }

  private async endLive(guildId: string, presence: Presence) {
    const guild = presence.guild;
    if (!guild) return;

    const config = await this.guildRepository.findOrCreate(guildId, {
      name: guild.name,
      ownerId: guild.ownerId ?? '0'
    });

    if (!config.config.liveChannel) return;

    const channel = guild.channels.cache.get(config.config.liveChannel);
    if (!channel?.isTextBased()) return;

    await channel.send({
      embeds: [
        {
          color: 0x5555ff,
          description: `A live de <@${presence.userId}> foi encerrada.`,
          timestamp: new Date().toISOString()
        }
      ]
    });
  }

  private buildKey(guildId: string, userId: string) {
    return `${guildId}:${userId}`;
  }
}
