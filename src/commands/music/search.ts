import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Busca músicas no YouTube.')
    .addStringOption((option) => option.setName('termo').setDescription('Termo de busca').setRequired(true)),
  category: 'music',
  async execute(interaction) {
    const term = interaction.options.getString('termo', true);
    const results = await getMusicService(interaction).search(term, 5);

    if (results.length === 0) {
      await interaction.reply({ content: 'Nenhum resultado encontrado.', ephemeral: true });
      return;
    }

    const embed = buildEmbed({
      title: `🔍 Resultados para "${term}"`
    });

    embed.setDescription(results.map((track, index) => `**${index + 1}.** [${track.title}](${track.url})`).join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
