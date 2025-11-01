import { PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';

export const ensureModerator = (interaction: ChatInputCommandInteraction) => {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new Error('Você não tem permissão para usar este comando.');
  }
};

export const ensureAdmin = (interaction: ChatInputCommandInteraction) => {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    throw new Error('Apenas administradores podem executar este comando.');
  }
};
