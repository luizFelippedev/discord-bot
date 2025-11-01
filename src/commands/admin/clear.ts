import { SlashCommandBuilder, PermissionFlagsBits, type GuildTextBasedChannel } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens em um canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option.setName('quantidade').setDescription('Quantidade de mensagens a serem removidas (1-100)').setRequired(true)
    ),
  category: 'admin',
  async execute(interaction) {
    const amount = interaction.options.getInteger('quantidade', true);

    const channel = interaction.channel;

    if (!channel?.isTextBased() || channel.isDMBased()) {
      await interaction.reply({ content: 'Este comando só pode ser usado em canais de texto.', ephemeral: true });
      return;
    }

    if (amount < 1 || amount > 100) {
      await interaction.reply({ content: 'Informe uma quantidade entre 1 e 100 mensagens.', ephemeral: true });
      return;
    }

    const deleted = await (channel as GuildTextBasedChannel).bulkDelete(amount, true);
    await interaction.reply({ content: `🧹 Removidas ${deleted.size} mensagens.`, ephemeral: true });
  }
};

export default command;
