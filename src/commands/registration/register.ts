import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('register').setDescription('Inicia o processo de registro no servidor.'),
  category: 'registration',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const session = await interaction.client.services.registration.initiate(interaction.guild.id, interaction.user.id);

    await interaction.reply({
      content: `🔐 Um código foi enviado no seu DM. Utilize /verify ${session.code} para finalizar.`,
      ephemeral: true
    });

    await interaction.user.send({
      content: `Seu código de verificação para **${interaction.guild.name}** é: **${session.code}**`
    });
  }
};

export default command;
