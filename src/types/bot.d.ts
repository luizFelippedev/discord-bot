import type { Collection } from 'discord.js';
import type { Logger } from 'winston';
import type { SlashCommand } from './commands';
import type { AppConfig } from '../config/config';
import type { DatabaseManager } from '../config/database';
import type { ServiceRegistry } from '../services/index';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, SlashCommand>;
    config: AppConfig;
    db: DatabaseManager;
    logger: Logger;
    services: ServiceRegistry;
  }
}
