import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Mini-games divertidos.')
    .addSubcommand((sub) => sub.setName('coinflip').setDescription('Cara ou coroa!'))
    .addSubcommand((sub) => sub.setName('dice').setDescription('Rola um dado de 6 lados.'))
    .addSubcommand((sub) =>
      sub
        .setName('bet')
        .setDescription('Aposte suas moedas em um número.')
        .addIntegerOption((option) => option.setName('valor').setDescription('Valor da aposta').setRequired(true).setMinValue(10))
        .addIntegerOption((option) => option.setName('número').setDescription('Número de 1 a 6').setRequired(true).setMinValue(1).setMaxValue(6))
    ),
  category: 'interaction',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Comando disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'coinflip': {
        const result = Math.random() > 0.5 ? 'cara' : 'coroa';
        await interaction.reply({ content: `🪙 Caiu **${result.toUpperCase()}**!` });
        break;
      }
      case 'dice': {
        const roll = Math.floor(Math.random() * 6) + 1;
        await interaction.reply({ content: `🎲 Você rolou **${roll}**!` });
        break;
      }
      case 'bet': {
        const amount = interaction.options.getInteger('valor', true);
        const chosen = interaction.options.getInteger('número', true);
        const roll = Math.floor(Math.random() * 6) + 1;

        if (chosen === roll) {
          await interaction.client.services.economy.adjustBalance(interaction.guild.id, interaction.user.id, amount * 2, 'Bet win');
          await interaction.reply({ content: `🎉 Você venceu! Número sorteado: ${roll}. Ganhou ${amount * 2} moedas.` });
        } else {
          await interaction.client.services.economy.adjustBalance(interaction.guild.id, interaction.user.id, -amount, 'Bet loss');
          await interaction.reply({ content: `😢 Você perdeu. Número sorteado: ${roll}. Perdeu ${amount} moedas.` });
        }
        break;
      }
      default:
        await interaction.reply({ content: 'Mini-game não implementado.', ephemeral: true });
        break;
    }
  }
};

export default command;
