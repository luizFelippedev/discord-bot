import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('polls')
    .setDescription('Cria uma votação rápida.')
    .addStringOption((option) => option.setName('pergunta').setDescription('Pergunta da enquete').setRequired(true))
    .addStringOption((option) =>
      option.setName('opções').setDescription('Opções separadas por ponto e vírgula (máx. 5)').setRequired(true)
    ),
  category: 'interaction',
  async execute(interaction) {
    const question = interaction.options.getString('pergunta', true);
    const options = interaction.options
      .getString('opções', true)
      .split(';')
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (options.length < 2) {
      await interaction.reply({ content: 'Informe pelo menos duas opções.', ephemeral: true });
      return;
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const embed = buildEmbed({
      title: '📊 Nova votação!',
      description: options.map((option, index) => `${emojis[index]} ${option}`).join('\n')
    }).setFooter({ text: `Criada por ${interaction.user.tag}` });

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]);
    }
  }
};

export default command;
