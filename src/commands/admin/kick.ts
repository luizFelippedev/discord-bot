import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um usuário do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário a ser expulso').setRequired(true))
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo da expulsão').setRequired(false)),
  category: 'admin',
  async execute(interaction) {
    const target = interaction.options.getUser('usuário', true);
    const reason = interaction.options.getString('motivo') ?? 'Nenhum motivo fornecido.';

    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member || !member.kickable) {
      await interaction.reply({ content: 'Não posso expulsar este membro.', ephemeral: true });
      return;
    }

    await member.kick(reason);
    await interaction.reply({ content: `👢 ${target.tag} foi expulso. Motivo: ${reason}` });
  }
};

export default command;
