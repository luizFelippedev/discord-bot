import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('stats').setDescription('Mostra estatísticas gerais do servidor.'),
  category: 'dashboard',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em um servidor.', ephemeral: true });
      return;
    }

    const overview = await interaction.client.services.dashboard.getOverview(interaction.guild);

    const embed = buildEmbed({
      title: '📊 Dashboard do Servidor',
      description: 'Estatísticas gerais'
    }).addFields(
      { name: '👥 Membros', value: `${overview.memberCount}`, inline: true },
      { name: '🟢 Online', value: `${overview.onlineMembers}`, inline: true },
      { name: '💬 Canais de texto', value: `${overview.textChannels}`, inline: true },
      { name: '🎙️ Canais de voz', value: `${overview.voiceChannels}`, inline: true },
      { name: '🎧 Gravações', value: `${overview.recordings}`, inline: true },
      { name: '💰 Economia total', value: `${overview.totalCoins}`, inline: true }
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
