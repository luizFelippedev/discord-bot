import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Client } from 'discord.js';
import type { EventModule } from '../types/events.js';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.ts', '.mjs', '.cjs']);

const resolveEventsDirectory = () => fileURLToPath(new URL('../events', import.meta.url));

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

const importEvent = async (filePath: string): Promise<EventModule | null> => {
  const module = await import(pathToFileURL(filePath).href);
  const event: EventModule | undefined = module.default ?? module.event;
  return event ?? null;
};

export class EventHandler {
  constructor(private readonly client: Client) {}

  public async load(): Promise<void> {
    const eventsDirectory = resolveEventsDirectory();
    const files = await walk(eventsDirectory);

    for (const file of files) {
      try {
        const event = await importEvent(file);

        if (!event) continue;

        const executor = (...args: unknown[]) => {
          void event.execute.apply(null, args as never);
        };

        if (event.once) {
          this.client.once(event.name, executor);
        } else {
          this.client.on(event.name, executor);
        }

        this.client.logger.debug('Registered event %s from %s', event.name, file);
      } catch (error) {
        this.client.logger.error('Failed to load event file %s: %o', file, error);
      }
    }
  }
}
