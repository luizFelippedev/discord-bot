import type { ChatInputCommandInteraction } from 'discord.js';
import type { MusicService } from '../../services/musicService.js';

export const getMusicService = (interaction: ChatInputCommandInteraction): MusicService => {
  const service = interaction.client.services.music;
  if (!service) {
    throw new Error('Serviço de música não disponível.');
  }
  return service;
};
