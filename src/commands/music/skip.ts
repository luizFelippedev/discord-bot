import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Pula a música atual.'),
  category: 'music',
  async execute(interaction) {
    const skipped = getMusicService(interaction).skip(interaction.guild!);
    await interaction.reply({ content: skipped ? '⏭️ Música pulada.' : 'Não há música para pular.', ephemeral: true });
  }
};

export default command;
