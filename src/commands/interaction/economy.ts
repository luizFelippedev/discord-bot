import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { GuildRepository } from '../../database/repositories/guildRepository.js';
import type { IUser } from '../../database/models/User.js';

const guildRepository = new GuildRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Sistema de economia do servidor.')
    .addSubcommand((sub) => sub.setName('balance').setDescription('Consulta seu saldo ou de outro usuário').addUserOption((option) => option.setName('usuário').setDescription('Usuário alvo')))
    .addSubcommand((sub) => sub.setName('daily').setDescription('Coleta a recompensa diária.'))
    .addSubcommand((sub) => sub.setName('work').setDescription('Trabalha para ganhar moedas.'))
    .addSubcommand((sub) => sub.setName('leaderboard').setDescription('Mostra o ranking financeiro.')),
  category: 'interaction',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const economyService = interaction.client.services.economy;
    const guildConfig = await guildRepository.findOrCreate(interaction.guild.id, {
      name: interaction.guild.name,
      ownerId: interaction.guild.ownerId ?? '0'
    });

    switch (subcommand) {
      case 'balance': {
        const target = interaction.options.getUser('usuário') ?? interaction.user;
        const balance = await economyService.getBalance(interaction.guild.id, target.id);
        await interaction.reply({ content: `💰 Saldo de ${target}: **${balance}** moedas.` });
        break;
      }
      case 'daily': {
        try {
          const result = await economyService.awardDaily(interaction.guild.id, interaction.user.id, guildConfig.config);
          await interaction.reply({ content: `🎁 Você recebeu ${result.amount} moedas! Saldo atual: ${result.balance}.` });
        } catch (error: any) {
          await interaction.reply({ content: error.message ?? 'Não foi possível coletar a diária.', ephemeral: true });
        }
        break;
      }
      case 'work': {
        try {
          const result = await economyService.work(interaction.guild.id, interaction.user.id, guildConfig.config);
          await interaction.reply({ content: `🛠️ Você trabalhou e ganhou ${result.amount} moedas! Saldo: ${result.balance}.` });
        } catch (error: any) {
          await interaction.reply({ content: error.message ?? 'Não foi possível trabalhar agora.', ephemeral: true });
        }
        break;
      }
      case 'leaderboard': {
        const leaders = await economyService.leaderboard(interaction.guild.id, 10);
        const description =
          leaders
            .map((user: IUser, index: number) => `**${index + 1}.** ${user.username} - ${user.coins} moedas`)
            .join('\n') || 'Nenhum dado disponível.';
        await interaction.reply({ content: `🏦 Ranking de moedas:\n${description}` });
        break;
      }
      default:
        await interaction.reply({ content: 'Subcomando não implementado.', ephemeral: true });
        break;
    }
  }
};

export default command;
