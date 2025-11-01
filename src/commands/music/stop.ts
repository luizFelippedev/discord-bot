import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Para a reprodução e limpa a fila.'),
  category: 'music',
  async execute(interaction) {
    getMusicService(interaction).stop(interaction.guild!);
    await interaction.reply({ content: '⏹️ Reprodução parada e fila limpa.' });
  }
};

export default command;
