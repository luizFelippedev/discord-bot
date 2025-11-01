import mongoose, { type ConnectOptions } from 'mongoose';
import { PrismaClient } from '@prisma/client';
import type { AppConfig } from './config.js';

export class DatabaseManager {
  public readonly prisma: PrismaClient | null;
  private mongoConnected = false;

  constructor(private readonly config: AppConfig) {
    this.prisma = this.createPrismaClient();
  }

  public async connect(): Promise<void> {
    await Promise.all([this.connectMongo(), this.connectPrisma()]);
  }

  public async disconnect(): Promise<void> {
    await Promise.all([this.disconnectMongo(), this.disconnectPrisma()]);
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

  private async connectPrisma(): Promise<void> {
    if (!this.prisma) return;
    await this.prisma.$connect();
  }

  private async disconnectPrisma(): Promise<void> {
    if (!this.prisma) return;
    await this.prisma.$disconnect();
  }

  private createPrismaClient(): PrismaClient | null {
    try {
      return new PrismaClient({
        datasources: {
          db: {
            url: this.config.database.prismaUrl
          }
        }
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Prisma initialization error';
      console.warn(`[database] Prisma client disabled: ${message}`);
      return null;
    }
  }
}
