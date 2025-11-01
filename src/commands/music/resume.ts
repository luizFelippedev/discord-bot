import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Retoma a reprodução.'),
  category: 'music',
  async execute(interaction) {
    const resumed = getMusicService(interaction).resume(interaction.guild!);
    await interaction.reply({ content: resumed ? '▶️ Música retomada.' : 'A música já está tocando.', ephemeral: true });
  }
};

export default command;
