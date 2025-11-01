import { randomBytes } from 'node:crypto';
import { Collection } from 'discord.js';
import type { IUser } from '../database/models/User.js';
import { UserRepository } from '../database/repositories/userRepository.js';

interface RegistrationSession {
  code: string;
  userId: string;
  guildId: string;
  createdAt: Date;
  expiresAt: Date;
}

export class RegistrationService {
  private readonly userRepository = new UserRepository();
  private readonly sessions = new Collection<string, RegistrationSession>();

  public async initiate(guildId: string, userId: string): Promise<RegistrationSession> {
    const code = randomBytes(3).toString('hex');
    const session: RegistrationSession = {
      code,
      userId,
      guildId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };

    this.sessions.set(this.buildKey(guildId, userId), session);
    await this.userRepository.findOrCreate(guildId, userId);

    return session;
  }

  public async verify(guildId: string, userId: string, code: string): Promise<IUser> {
    const key = this.buildKey(guildId, userId);
    const session = this.sessions.get(key);

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new Error('Código inválido ou expirado.');
    }

    if (session.code !== code) {
      throw new Error('O código informado está incorreto.');
    }

    this.sessions.delete(key);
    const user = await this.userRepository.findOrCreate(guildId, userId);
    user.profile.bio = user.profile.bio ?? 'Novo membro registrado';
    await user.save();

    return user;
  }

  public getSession(guildId: string, userId: string): RegistrationSession | undefined {
    return this.sessions.get(this.buildKey(guildId, userId));
  }

  private buildKey(guildId: string, userId: string) {
    return `${guildId}:${userId}`;
  }
}
