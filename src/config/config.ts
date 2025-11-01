import 'dotenv/config';
import { resolve } from 'node:path';

export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId?: string;
  prefix: string;
  ownerId: string;
}

export interface DatabaseConfig {
  mongoUri: string;
  prismaUrl: string;
}

export interface DashboardConfig {
  port: number;
  sessionSecret: string;
  callbackUrl: string;
}

export interface ExternalApisConfig {
  youtubeApiKey?: string;
  spotifyClientId?: string;
  spotifyClientSecret?: string;
}

export interface PathsConfig {
  recordings: string;
  logs: string;
}

export interface AppConfig {
  environment: 'development' | 'production' | 'test';
  discord: DiscordConfig;
  database: DatabaseConfig;
  dashboard: DashboardConfig;
  apis: ExternalApisConfig;
  paths: PathsConfig;
  features: {
    autoModeration: boolean;
    voiceRecording: boolean;
    liveNotifications: boolean;
    dashboard: boolean;
  };
}

const required = (value: string | undefined, name: string): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const parseNumber = (value: string | undefined, fallback: number, name: string): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Expected ${name} to be a numeric value, received "${value}".`);
  }

  return parsed;
};

export const loadConfig = (): AppConfig => {
  const environment = (process.env.NODE_ENV as AppConfig['environment']) ?? 'development';
  const recordings = resolve(process.env.RECORDINGS_PATH ?? './recordings');
  const logs = resolve(process.env.LOGS_PATH ?? './logs');

  return {
    environment,
    discord: {
      token: required(process.env.DISCORD_TOKEN, 'DISCORD_TOKEN'),
      clientId: required(process.env.CLIENT_ID, 'CLIENT_ID'),
      guildId: process.env.GUILD_ID?.trim(),
      prefix: process.env.PREFIX?.trim() ?? '!',
      ownerId: required(process.env.OWNER_ID, 'OWNER_ID')
    },
    database: {
      mongoUri: required(process.env.MONGODB_URI, 'MONGODB_URI'),
      prismaUrl: required(process.env.DATABASE_URL, 'DATABASE_URL')
    },
    dashboard: {
      port: parseNumber(process.env.PORT, 3000, 'PORT'),
      sessionSecret: required(process.env.SESSION_SECRET, 'SESSION_SECRET'),
      callbackUrl: required(process.env.CALLBACK_URL, 'CALLBACK_URL')
    },
    apis: {
      youtubeApiKey: process.env.YOUTUBE_API_KEY?.trim(),
      spotifyClientId: process.env.SPOTIFY_CLIENT_ID?.trim(),
      spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET?.trim()
    },
    paths: {
      recordings,
      logs
    },
    features: {
      autoModeration: process.env.FEATURE_AUTOMOD !== 'false',
      voiceRecording: process.env.FEATURE_VOICE_RECORDING !== 'false',
      liveNotifications: process.env.FEATURE_LIVE_NOTIFICATION !== 'false',
      dashboard: process.env.FEATURE_DASHBOARD !== 'false'
    }
  };
};

export const config = loadConfig();
