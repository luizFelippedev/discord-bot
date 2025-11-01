import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica um aviso a um usuário.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário a ser avisado').setRequired(true))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo do aviso').setRequired(true)),
  category: 'admin',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const user = interaction.options.getUser('usuário', true);
    const reason = interaction.options.getString('motivo', true);
    const member = await interaction.guild.members.fetch(user.id);

    await interaction.client.services.moderation.issueWarning(interaction.guild.id, interaction.user.id, user.id, reason);
    await interaction.client.services.moderation.escalate(member, 'warn', reason);

    await interaction.reply({ content: `⚠️ Aviso aplicado a ${user}. Motivo: ${reason}` });
  }
};

export default command;
