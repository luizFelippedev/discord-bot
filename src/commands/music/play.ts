import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Toca uma música pelo link ou por nome.')
    .addStringOption((option) => option.setName('query').setDescription('Link ou nome da música').setRequired(true)),
  category: 'music',
  async execute(interaction) {
    const query = interaction.options.getString('query', true);

    await interaction.deferReply();

    try {
      const result = await getMusicService(interaction).play(interaction, query);

      const embed = buildEmbed({
        title: '🎶 Música adicionada à fila',
        description: `**${result.track.title}**`
      }).addFields(
        { name: 'URL', value: result.track.url },
        { name: 'Fila', value: `${result.queue.length} músicas na fila.` }
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      await interaction.editReply({ content: error.message ?? 'Não foi possível tocar esta música.' });
    }
  }
};

export default command;
