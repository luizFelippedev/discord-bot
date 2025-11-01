import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import axios from 'axios';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('lyrics').setDescription('Exibe a letra da música atual.'),
  category: 'music',
  async execute(interaction) {
    const current = getMusicService(interaction).nowPlaying(interaction.guild!);

    if (!current) {
      await interaction.reply({ content: 'Nenhuma música tocando no momento.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const response = await axios.get('https://some-random-api.ml/lyrics', {
        params: { title: current.title },
        timeout: 5_000
      });

      const lyrics: string = response.data?.lyrics;

      if (!lyrics) {
        throw new Error('Letra não encontrada.');
      }

      const chunks = lyrics.match(/[\s\S]{1,2000}/g) ?? [];
      const embeds = chunks.slice(0, 3).map((chunk, index) =>
        buildEmbed({
          title: index === 0 ? `🎤 Letra - ${current.title}` : `Continuação (${index + 1})`
        }).setDescription(chunk)
      );

      await interaction.editReply({ embeds });
    } catch (error) {
      await interaction.editReply({
        content: 'Não foi possível obter a letra no momento.'
      });
    }
  }
};

export default command;
