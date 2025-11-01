import { Collection } from 'discord.js';

export class CooldownManager {
  private readonly timestamps = new Collection<string, number>();

  constructor(private readonly cooldownSeconds: number) {}

  public take(key: string): boolean {
    const now = Date.now();
    const cooldown = this.cooldownSeconds * 1000;
    const expiration = this.timestamps.get(key);

    if (expiration && now < expiration) {
      return false;
    }

    this.timestamps.set(key, now + cooldown);
    return true;
  }

  public timeLeft(key: string): number {
    const expiration = this.timestamps.get(key);
    if (!expiration) return 0;

    const remaining = expiration - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }
}
