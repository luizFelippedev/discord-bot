import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Embaralha a fila de reprodução.'),
  category: 'music',
  async execute(interaction) {
    getMusicService(interaction).shuffle(interaction.guild!);
    await interaction.reply({ content: '🔀 Fila embaralhada!', ephemeral: true });
  }
};

export default command;
