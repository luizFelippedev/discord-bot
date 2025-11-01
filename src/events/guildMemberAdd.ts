import { EmbedBuilder } from 'discord.js';
import type { EventModule } from '../types/events.js';
import { GuildRepository } from '../database/repositories/guildRepository.js';

const guildRepository = new GuildRepository();

const event: EventModule<'guildMemberAdd'> = {
  name: 'guildMemberAdd',
  async execute(member) {
    const client = member.client;
    const guildConfig = await guildRepository.findOrCreate(member.guild.id, {
      name: member.guild.name,
      ownerId: member.guild.ownerId ?? '0'
    });

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎉 Bem-vindo ao Servidor!')
      .setDescription(`Seja muito bem-vindo, ${member}!`)
      .setThumbnail(member.displayAvatarURL())
      .addFields(
        { name: '📝 Registro', value: 'Use /register para iniciar seu cadastro' },
        { name: '📜 Regras', value: '#regras' }
      )
      .setImage('https://i.imgur.com/UM3mrju.gif')
      .setFooter({ text: `Membro #${member.guild.memberCount}` })
      .setTimestamp(new Date());

    const welcomeChannelId = guildConfig.config.welcomeChannel;
    if (welcomeChannelId) {
      const channel = member.guild.channels.cache.get(welcomeChannelId);
      if (channel?.isTextBased()) {
        await channel.send({ content: `👋 ${member}`, embeds: [welcomeEmbed] });
      }
    }

    try {
      await member.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('Boas-vindas!')
            .setDescription(`Olá ${member.displayName}, seja bem-vindo ao **${member.guild.name}**!`)
            .addFields({ name: '📝 Registro', value: 'Use /register no servidor para validar sua entrada.' })
        ]
      });
    } catch (error) {
      client.logger.warn('Não foi possível enviar DM de boas-vindas para %s: %o', member.id, error);
    }

    if (guildConfig.config.autoRole) {
      const role = member.guild.roles.cache.get(guildConfig.config.autoRole);
      if (role) {
        await member.roles.add(role, 'Auto role configurado.');
      }
    }
  }
};

export default event;
