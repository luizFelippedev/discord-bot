import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Finaliza o registro com o código recebido.')
    .addStringOption((option) => option.setName('código').setDescription('Código de verificação').setRequired(true)),
  category: 'registration',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const code = interaction.options.getString('código', true);

    try {
      await interaction.client.services.registration.verify(interaction.guild.id, interaction.user.id, code);
      await interaction.reply({ content: '✅ Registro concluído com sucesso!' });
    } catch (error: any) {
      await interaction.reply({ content: error.message ?? 'Não foi possível verificar o código.', ephemeral: true });
    }
  }
};

export default command;
