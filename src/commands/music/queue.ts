import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila de músicas.'),
  category: 'music',
  async execute(interaction) {
    const queue = getMusicService(interaction).queue(interaction.guild!);

    if (queue.length === 0) {
      await interaction.reply({ content: 'A fila está vazia.', ephemeral: true });
      return;
    }

    const embed = buildEmbed({
      title: '🎶 Fila de Reprodução'
    });

    embed.setDescription(queue.slice(0, 10).map((track, index) => `**${index + 1}.** ${track.title} (por ${track.requestedBy})`).join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
