import { EmbedBuilder, type ColorResolvable } from 'discord.js';

interface EmbedOptions {
  title?: string;
  description?: string;
  color?: ColorResolvable;
  footer?: string;
  thumbnail?: string;
}

export const buildEmbed = (options: EmbedOptions = {}) => {
  const embed = new EmbedBuilder();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color) embed.setColor(options.color);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);

  embed.setTimestamp(new Date());
  return embed;
};
