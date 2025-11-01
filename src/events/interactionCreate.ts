import { Collection } from 'discord.js';
import type { EventModule } from '../types/events.js';

const cooldowns = new Collection<string, Collection<string, number>>();

const event: EventModule<'interactionCreate'> = {
  name: 'interactionCreate',
  async execute(interaction) {
    const client = interaction.client;

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        client.logger.error('Autocomplete error for command %s: %o', interaction.commandName, error);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: 'Comando não encontrado.', ephemeral: true });
      return;
    }

    if (command.cooldown) {
      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name) ?? new Collection<string, number>();
      const cooldownAmount = command.cooldown * 1000;
      const expirationTime = timestamps.get(interaction.user.id);

      if (expirationTime && now < expirationTime) {
        const remaining = Math.ceil((expirationTime - now) / 1000);
        await interaction.reply({ content: `⏳ Você precisa esperar ${remaining}s para usar este comando novamente.`, ephemeral: true });
        return;
      }

      timestamps.set(interaction.user.id, now + cooldownAmount);
      cooldowns.set(command.data.name, timestamps);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      client.logger.error('Error executing command %s: %o', command.data.name, error);
      const replyContent = {
        content: 'Ocorreu um erro ao processar o comando. Tente novamente mais tarde.',
        ephemeral: true
      } as const;

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(replyContent);
      } else {
        await interaction.reply(replyContent);
      }
    }
  }
};

export default event;
