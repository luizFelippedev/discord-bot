import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  type InteractionReplyOptions,
  type ChatInputCommandInteraction
} from 'discord.js';

export interface PaginatedEmbed {
  title: string;
  pages: EmbedBuilder[];
}

export const paginate = async (interaction: ChatInputCommandInteraction, embed: PaginatedEmbed, timeout = 60_000) => {
  if (embed.pages.length === 0) {
    throw new Error('Não há dados para exibir.');
  }

  let current = 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('prev').setLabel('Anterior').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('next').setLabel('Próximo').setStyle(ButtonStyle.Secondary)
  );

  const replyOptions: InteractionReplyOptions = {
    embeds: [embed.pages[current]],
    components: embed.pages.length > 1 ? [row] : [],
    ephemeral: true
  };

  const reply = await interaction.reply(replyOptions);

  if (embed.pages.length === 1) return reply;

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeout
  });

  collector.on('collect', async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({ content: 'Você não pode interagir com esta paginação.', ephemeral: true });
      return;
    }

    current = buttonInteraction.customId === 'next' ? (current + 1) % embed.pages.length : (current - 1 + embed.pages.length) % embed.pages.length;

    await buttonInteraction.update({
      embeds: [embed.pages[current]]
    });
  });

  collector.on('end', async () => {
    await interaction.editReply({ components: [] });
  });
};
