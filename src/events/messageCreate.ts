import { PermissionsBitField, type GuildTextBasedChannel } from 'discord.js';
import type { EventModule } from '../types/events.js';
import { GuildRepository } from '../database/repositories/guildRepository.js';

const guildRepository = new GuildRepository();

const event: EventModule<'messageCreate'> = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const client = message.client;
    const guildConfig = await guildRepository.findOrCreate(message.guild.id, {
      name: message.guild.name,
      ownerId: message.guild.ownerId ?? '0'
    });

    const moderationResult = client.services.moderation.analyzeMessage(message, guildConfig.config);

    if (moderationResult.violated) {
      if (moderationResult.action === 'delete') {
        await message.delete();
      }

      const member = await message.guild.members.fetch(message.author.id);
      await client.services.moderation.issueWarning(message.guild.id, client.user?.id ?? 'bot', message.author.id, moderationResult.reason ?? 'Motivo não informado');
      await client.services.moderation.escalate(member, moderationResult.action ?? 'warn', moderationResult.reason ?? 'Conduta imprópria.');

      const logChannelId = guildConfig.config.logChannel;
      const potentialChannel = logChannelId ? message.guild.channels.cache.get(logChannelId) : null;
      const logChannel =
        potentialChannel && potentialChannel.isTextBased() && !potentialChannel.isDMBased()
          ? (potentialChannel as GuildTextBasedChannel)
          : null;
      await client.services.moderation.log(
        logChannel,
        `⚠️ ${message.author} violou as regras: ${moderationResult.reason ?? 'motivo não informado'}.`
      );
      return;
    }

    const levelingResult = await client.services.leveling.rewardForMessage(message.guild.id, message.author.id);
    if (levelingResult?.leveledUp) {
      await message.channel.send({
        content: `🎉 Parabéns ${message.author}! Você chegou ao nível **${levelingResult.newLevel}**!`
      });
    }

    if (message.content.startsWith(guildConfig.config.prefix ?? '!')) {
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;
      await message.reply('Os comandos baseados em prefixo estão desativados. Utilize os slash commands (`/`).');
    }
  }
};

export default event;
