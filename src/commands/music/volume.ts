import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { getMusicService } from './_helpers.js';
import { ensureRange } from '../../utils/validators.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta o volume da reprodução.')
    .addIntegerOption((option) => option.setName('valor').setDescription('Valor de 0 a 100').setRequired(true).setMinValue(0).setMaxValue(100)),
  category: 'music',
  async execute(interaction) {
    const value = interaction.options.getInteger('valor', true);
    ensureRange(value, 0, 100, 'O volume deve estar entre 0 e 100.');

    getMusicService(interaction).setVolume(interaction.guild!, value / 100);
    await interaction.reply({ content: `🔊 Volume ajustado para ${value}%` });
  }
};

export default command;
