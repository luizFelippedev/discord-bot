import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um usuário do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário a ser banido').setRequired(true))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo do banimento').setRequired(false)),
  category: 'admin',
  async execute(interaction) {
    const target = interaction.options.getUser('usuário', true);
    const reason = interaction.options.getString('motivo') ?? 'Nenhum motivo fornecido.';

    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Usuário não encontrado no servidor.', ephemeral: true });
      return;
    }

    if (!member.bannable) {
      await interaction.reply({ content: 'Não é possível banir este usuário.', ephemeral: true });
      return;
    }

    await member.ban({ reason });
    await interaction.reply({ content: `🚨 ${target.tag} foi banido. Motivo: ${reason}` });
  }
};

export default command;
