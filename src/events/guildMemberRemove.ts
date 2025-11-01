import { EmbedBuilder } from 'discord.js';
import type { EventModule } from '../types/events.js';
import { GuildRepository } from '../database/repositories/guildRepository.js';

const guildRepository = new GuildRepository();

const event: EventModule<'guildMemberRemove'> = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildConfig = await guildRepository.findOrCreate(member.guild.id, {
      name: member.guild.name,
      ownerId: member.guild.ownerId ?? '0'
    });

    const logChannelId = guildConfig.config.logChannel;
    if (!logChannelId) return;

    const channel = member.guild.channels.cache.get(logChannelId);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0xff5555)
      .setTitle('👋 Adeus!')
      .setDescription(`${member.user.tag} saiu do servidor.`)
      .setThumbnail(member.displayAvatarURL())
      .setTimestamp(new Date());

    await channel.send({ embeds: [embed] });
  }
};

export default event;
