import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('server-info').setDescription('Mostra informações detalhadas do servidor.'),
  category: 'dashboard',
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({ content: 'Comando disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const embed = buildEmbed({
      title: `📁 Informações do Servidor - ${guild.name}`
    }).setThumbnail(guild.iconURL())
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Canais', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🔐 Nível de verificação', value: `${guild.verificationLevel}`, inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
