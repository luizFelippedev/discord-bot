import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import type { IUser } from '../../database/models/User.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Sistema de níveis do servidor.')
    .addSubcommand((sub) => sub.setName('profile').setDescription('Mostra seu nível atual.').addUserOption((option) => option.setName('usuário').setDescription('Usuário alvo')))
    .addSubcommand((sub) => sub.setName('rank').setDescription('Mostra o ranking de níveis.')),
  category: 'interaction',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Comando disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const levelingService = interaction.client.services.leveling;
    const sub = interaction.options.getSubcommand();

    if (sub === 'profile') {
      const target = interaction.options.getUser('usuário') ?? interaction.user;
      const record = await levelingService.getProfile(interaction.guild.id, target.id);
      const level = record.level;
      const xp = record.xp;

      await interaction.reply({ content: `📈 ${target} está no nível **${level}** com ${xp} XP.` });
      return;
    }

    if (sub === 'rank') {
      const top = await levelingService.getLeaderboard(interaction.guild.id, 10);
      const response =
        top
          .map((user: IUser, index: number) => `**${index + 1}.** ${user.username} - Nível ${user.level} (${user.xp} XP)`)
          .join('\n') || 'Sem dados disponíveis.';

      await interaction.reply({ content: `🏆 Ranking de níveis:\n${response}` });
    }
  }
};

export default command;
