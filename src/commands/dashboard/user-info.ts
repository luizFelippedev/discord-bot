import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import { UserRepository } from '../../database/repositories/userRepository.js';

const userRepository = new UserRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('user-info')
    .setDescription('Mostra informações detalhadas de um usuário.')
    .addUserOption((option) => option.setName('usuário').setDescription('Usuário alvo').setRequired(false)),
  category: 'dashboard',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Usuário não encontrado.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('usuário') ?? interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Usuário não encontrado.', ephemeral: true });
      return;
    }

    const userData = await userRepository.findOrCreate(interaction.guild.id, member.user.id, {
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatarUrl: member.user.displayAvatarURL() ?? undefined
    });

    const embed = buildEmbed({
      title: `👤 Perfil de ${member.user.username}`
    })
      .setThumbnail(member.displayAvatarURL())
      .addFields(
        { name: '🆔 ID', value: member.user.id, inline: true },
        { name: '📅 Entrou em', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>`, inline: true },
        { name: '🎮 Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '🏆 Nível', value: `${userData.level}`, inline: true },
        { name: '✨ XP', value: `${userData.xp}`, inline: true },
        { name: '💰 Coins', value: `${userData.coins}`, inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
