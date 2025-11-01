import { Schema, model, type Document, type Model } from 'mongoose';

export interface GuildConfig {
  prefix: string;
  welcomeChannel?: string;
  liveChannel?: string;
  logChannel?: string;
  muteRole?: string;
  autoRole?: string;
  language: string;
  dashboardAccess: string[];
  moderation: {
    antiSpam: boolean;
    antiLinks: boolean;
    antiCaps: boolean;
    profanityFilter: boolean;
  };
  economy: {
    dailyReward: number;
    workRewardRange: [number, number];
  };
}

export interface IGuild extends Document {
  guildId: string;
  name: string;
  iconUrl?: string;
  ownerId: string;
  config: GuildConfig;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    iconUrl: { type: String },
    ownerId: { type: String, required: true },
    config: {
      prefix: { type: String, default: '!' },
      welcomeChannel: { type: String },
      liveChannel: { type: String },
      logChannel: { type: String },
      muteRole: { type: String },
      autoRole: { type: String },
      language: { type: String, default: 'pt-BR' },
      dashboardAccess: { type: [String], default: [] },
      moderation: {
        antiSpam: { type: Boolean, default: true },
        antiLinks: { type: Boolean, default: true },
        antiCaps: { type: Boolean, default: true },
        profanityFilter: { type: Boolean, default: true }
      },
      economy: {
        dailyReward: { type: Number, default: 500 },
        workRewardRange: {
          type: [Number],
          default: [100, 600],
          validate: {
            validator: (value: number[]) => value.length === 2,
            message: 'workRewardRange must contain exactly two values.'
          }
        }
      }
    }
  },
  { timestamps: true }
);

export const GuildModel: Model<IGuild> = model('Guild', GuildSchema);
