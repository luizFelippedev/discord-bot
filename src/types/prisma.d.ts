declare module '@prisma/client' {
  interface PrismaClientOptions {
    datasources?: Record<string, { url?: string }>;
  }

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }
}
