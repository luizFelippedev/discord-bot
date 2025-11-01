import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLogger, format, transports } from 'winston';
import type { AppConfig } from './config.js';

const { combine, timestamp, printf, colorize, errors, splat } = format;

const buildTransports = (logsPath: string) => {
  const resolved = resolve(logsPath);

  if (!existsSync(resolved)) {
    void mkdir(resolved, { recursive: true });
  }

  return [
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: combine(colorize(), timestamp(), errors({ stack: true }), splat(), printf(({ level, message, timestamp: ts, stack }) => `${ts} ${level}: ${stack ?? message}`))
    }),
    new transports.File({
      filename: resolve(resolved, 'bot.log'),
      level: 'debug',
      format: combine(timestamp(), errors({ stack: true }), splat(), printf(({ level, message, timestamp: ts, stack }) => `${ts} ${level}: ${stack ?? message}`))
    })
  ];
};

export const buildLogger = (config: AppConfig) =>
  createLogger({
    level: 'debug',
    defaultMeta: { service: 'discord-bot', environment: config.environment },
    transports: buildTransports(config.paths.logs)
  });
