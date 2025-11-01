import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Mostra a música atual.'),
  category: 'music',
  async execute(interaction) {
    const current = getMusicService(interaction).nowPlaying(interaction.guild!);

    if (!current) {
      await interaction.reply({ content: 'Nenhuma música tocando no momento.', ephemeral: true });
      return;
    }

    const embed = buildEmbed({
      title: '🎧 Tocando Agora',
      description: `**${current.title}**`
    }).addFields({ name: 'Solicitado por', value: current.requestedBy });

    await interaction.reply({ embeds: [embed] });
  }
};

export default command;
