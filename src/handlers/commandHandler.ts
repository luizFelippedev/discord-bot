import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Client, Collection, REST, Routes } from 'discord.js';
import type { SlashCommand } from '../types/commands.js';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.ts', '.mjs', '.cjs']);

const resolveCommandsDirectory = () => fileURLToPath(new URL('../commands', import.meta.url));

const walk = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (SUPPORTED_EXTENSIONS.has(extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
};

const importCommand = async (filePath: string): Promise<SlashCommand | null> => {
  const module = await import(pathToFileURL(filePath).href);
  const command: SlashCommand | undefined = module.default ?? module.command;

  if (!command) {
    return null;
  }

  return command;
};

export class CommandHandler {
  private readonly rest: REST;

  constructor(private readonly client: Client) {
    this.rest = new REST({ version: '10' }).setToken(client.config.discord.token);
  }

  public async load(): Promise<void> {
    const commandDirectory = resolveCommandsDirectory();
    const files = await walk(commandDirectory);
    const registeredCommands: SlashCommand[] = [];

    this.client.commands = new Collection();

    for (const file of files) {
      try {
        const command = await importCommand(file);

        if (!command) {
          continue;
        }

        const name = command.data.name;
        if (!name) {
          this.client.logger.warn('Command at %s is missing a name and was skipped.', file);
          continue;
        }

        this.client.commands.set(name, command);
        registeredCommands.push(command);
        this.client.logger.debug('Loaded command %s from %s', name, file);
      } catch (error) {
        this.client.logger.error('Failed to load command file %s: %o', file, error);
      }
    }

    await this.publishSlashCommands(registeredCommands);
  }

  private async publishSlashCommands(commands: SlashCommand[]): Promise<void> {
    if (commands.length === 0) {
      this.client.logger.warn('No slash commands were discovered. Skipping registration.');
      return;
    }

    const payload = commands.map((command) => command.data.toJSON());
    const { clientId, guildId } = this.client.config.discord;

    try {
      if (this.client.config.environment === 'development' && guildId) {
        await this.rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: payload });
        this.client.logger.info('Registered %d guild slash commands for development guild %s.', payload.length, guildId);
      } else {
        await this.rest.put(Routes.applicationCommands(clientId), { body: payload });
        this.client.logger.info('Registered %d global slash commands.', payload.length);
      }
    } catch (error) {
      this.client.logger.error('Failed to register slash commands: %o', error);
    }
  }
}
