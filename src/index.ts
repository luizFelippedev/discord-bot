import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config/config.js';
import { buildLogger } from './config/logger.js';
import { DatabaseManager } from './config/database.js';
import { CommandHandler } from './handlers/commandHandler.js';
import { EventHandler } from './handlers/eventHandler.js';
import { registerProcessErrorHandlers } from './handlers/errorHandler.js';
import { createServices } from './services/index.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

const logger = buildLogger(config);
const databaseManager = new DatabaseManager(config);

client.commands = new Collection();
client.config = config;
client.logger = logger;
client.db = databaseManager;
client.services = createServices(client);

registerProcessErrorHandlers(logger);

const start = async () => {
  try {
    await databaseManager.connect();
    logger.info('Connected to both MongoDB and Prisma data sources successfully.');
  } catch (error) {
    logger.error('Failed to connect to databases: %o', error);
    process.exitCode = 1;
    return;
  }

  const commandHandler = new CommandHandler(client);
  const eventHandler = new EventHandler(client);

  await Promise.all([commandHandler.load(), eventHandler.load()]);

  try {
    await client.login(config.discord.token);
    logger.info('Bot logged in as %s', client.user?.tag);
  } catch (error) {
    logger.error('Failed to login to Discord: %o', error);
    process.exitCode = 1;
  }
};

start().catch((error) => {
  logger.error('Fatal error during startup: %o', error);
  process.exit(1);
});

const gracefulShutdown = async (signal: NodeJS.Signals) => {
  logger.info('Received %s, starting graceful shutdown...', signal);

  try {
    await client.destroy();
    await databaseManager.disconnect();
  } catch (error) {
    logger.error('Error while shutting down: %o', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
