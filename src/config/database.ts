import mongoose, { type ConnectOptions } from 'mongoose';
import type { AppConfig } from './config.js';

export class DatabaseManager {
  private mongoConnected = false;

  constructor(private readonly config: AppConfig) {}

  public async connect(): Promise<void> {
    await this.connectMongo();
  }

  public async disconnect(): Promise<void> {
    await this.disconnectMongo();
  }

  private async connectMongo(): Promise<void> {
    if (this.mongoConnected) return;

    const options: ConnectOptions = {
      dbName: new URL(this.config.database.mongoUri).pathname.replace('/', '') || 'discordbot',
      autoIndex: true
    };

    try {
      await mongoose.connect(this.config.database.mongoUri, options);
      this.mongoConnected = true;
    } catch (error) {
      this.mongoConnected = false;
      throw error;
    }
  }

  private async disconnectMongo(): Promise<void> {
    if (!this.mongoConnected) return;

    await mongoose.disconnect();
    this.mongoConnected = false;
  }
}
