import { Schema, model, type Document, type Model } from 'mongoose';

export interface InventoryItem {
  name: string;
  description?: string;
  quantity: number;
  value: number;
}

export interface IUser extends Document {
  discordId: string;
  guildId: string;
  username: string;
  discriminator: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  coins: number;
  dailyClaimedAt?: Date;
  workCooldownAt?: Date;
  profile: {
    bio?: string;
    bannerUrl?: string;
    birthday?: Date;
  };
  inventory: InventoryItem[];
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<InventoryItem>(
  {
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    value: { type: Number, default: 0 }
  },
  { _id: false }
);

const ProfileSchema = new Schema<IUser['profile']>(
  {
    bio: { type: String },
    bannerUrl: { type: String },
    birthday: { type: Date }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    discriminator: { type: String, required: true },
    avatarUrl: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    dailyClaimedAt: { type: Date },
    workCooldownAt: { type: Date },
    profile: { type: ProfileSchema, default: {} },
    inventory: { type: [InventoryItemSchema], default: [] },
    achievements: { type: [String], default: [] }
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const UserModel: Model<IUser> = model('User', UserSchema);
