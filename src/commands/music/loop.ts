import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Define o modo de loop.')
    .addStringOption((option) =>
      option
        .setName('modo')
        .setDescription('Modo de repetição')
        .setRequired(true)
        .addChoices(
          { name: 'Desligado', value: 'off' },
          { name: 'Música atual', value: 'track' },
          { name: 'Fila', value: 'queue' }
        )
    ),
  category: 'music',
  async execute(interaction) {
    const mode = interaction.options.getString('modo', true) as 'off' | 'track' | 'queue';
    getMusicService(interaction).setLoop(interaction.guild!, mode);
    await interaction.reply({ content: `🔁 Loop ajustado para **${mode}**.` });
  }
};

export default command;
