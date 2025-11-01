import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pausa a música atual.'),
  category: 'music',
  async execute(interaction) {
    const paused = getMusicService(interaction).pause(interaction.guild!);
    await interaction.reply({ content: paused ? '⏸️ Música pausada.' : 'A fila já está pausada.', ephemeral: true });
  }
};

export default command;
