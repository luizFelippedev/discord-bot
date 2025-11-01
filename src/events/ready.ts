import type { EventModule } from '../types/events.js';
import { GuildRepository } from '../database/repositories/guildRepository.js';
import { startDashboard } from '../dashboard/web/server.js';

const guildRepository = new GuildRepository();

const event: EventModule<'ready'> = {
  name: 'ready',
  once: true,
  async execute(client) {
    client.logger.info('Bot logged in as %s', client.user?.tag);

    client.user?.setPresence({
      status: 'online',
      activities: [{ name: 'monitorando o servidor', type: 3 }]
    });

    for (const guild of client.guilds.cache.values()) {
      await guildRepository.findOrCreate(guild.id, {
        name: guild.name,
        ownerId: guild.ownerId ?? '0',
        iconUrl: guild.iconURL() ?? undefined
      });
    }

    startDashboard(client);
  }
};

export default event;
