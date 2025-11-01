import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove uma música da fila.')
    .addIntegerOption((option) => option.setName('posição').setDescription('Posição na fila').setRequired(true).setMinValue(1)),
  category: 'music',
  async execute(interaction) {
    const pos = interaction.options.getInteger('posição', true);
    const removed = getMusicService(interaction).remove(interaction.guild!, pos);

    if (!removed) {
      await interaction.reply({ content: 'Posição inválida.', ephemeral: true });
      return;
    }

    await interaction.reply({ content: `❌ Removido **${removed.title}** da fila.` });
  }
};

export default command;
