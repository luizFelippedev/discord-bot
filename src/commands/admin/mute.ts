import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { GuildRepository } from '../../database/repositories/guildRepository.js';

const guildRepository = new GuildRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silencia um usuário por um determinado tempo.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário a ser silenciado').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('tempo').setDescription('Tempo em minutos').setRequired(true).setMinValue(1).setMaxValue(1440)
    )
    .addStringOption((option) => option.setName('motivo').setDescription('Motivo do mute').setRequired(false)),
  category: 'admin',
  async execute(interaction) {
    const user = interaction.options.getUser('usuário', true);
    const minutes = interaction.options.getInteger('tempo', true);
    const reason = interaction.options.getString('motivo') ?? 'Nenhum motivo informado.';

    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: 'Não foi possível encontrar o membro.', ephemeral: true });
      return;
    }

    const guildConfig = await guildRepository.findOrCreate(interaction.guild.id, {
      name: interaction.guild.name,
      ownerId: interaction.guild.ownerId ?? '0'
    });

    const muteRoleId = guildConfig.config.muteRole;
    const muteRole = muteRoleId ? interaction.guild.roles.cache.get(muteRoleId) : null;

    if (!muteRole) {
      await interaction.reply({
        content: 'Nenhum cargo de mute configurado. Configure usando /moderate.',
        ephemeral: true
      });
      return;
    }

    await member.roles.add(muteRole, reason);
    setTimeout(async () => {
      if (member.roles.cache.has(muteRole.id)) {
        await member.roles.remove(muteRole, 'Mute expirado.');
      }
    }, minutes * 60 * 1000);

    await interaction.reply({ content: `🔇 ${member} foi mutado por ${minutes} minutos. Motivo: ${reason}` });
  }
};

export default command;
