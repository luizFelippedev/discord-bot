import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import type { IWarning } from '../../database/models/Warning.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Lista os avisos de um usuário.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário alvo').setRequired(true)),
  category: 'admin',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('usuário', true);
    const warnings = await interaction.client.services.moderation.getWarnings(interaction.guild.id, user.id);

    if (warnings.length === 0) {
      await interaction.reply({ content: `✅ ${user} não possui avisos.`, ephemeral: true });
      return;
    }

    const description = warnings
      .map(
        (warning: IWarning, index: number) =>
          `**${index + 1}.** ${warning.reason} - <t:${Math.floor(warning.createdAt.getTime() / 1000)}:R>`
      )
      .join('\n');

    await interaction.reply({ content: `📋 Avisos de ${user}:\n${description}`, ephemeral: true });
  }
};

export default command;
