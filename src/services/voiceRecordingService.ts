import { joinVoiceChannel, VoiceConnection, VoiceConnectionStatus, EndBehaviorType } from '@discordjs/voice';
import type { Guild, Snowflake, VoiceBasedChannel, VoiceState } from 'discord.js';
import { Collection } from 'discord.js';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolve, join as joinPath } from 'node:path';
import { randomUUID } from 'node:crypto';
import prism from 'prism-media';
import type { Logger } from 'winston';
import type { VoiceRecordRepository } from '../database/repositories/recordRepository.js';
import type { AppConfig } from '../config/config.js';

interface ActiveStream {
  userId: Snowflake;
  outputPath: string;
  startedAt: Date;
  stop(): Promise<void>;
}

interface RecordingSession {
  id: string;
  guild: Guild;
  channel: VoiceBasedChannel;
  connection: VoiceConnection;
  startedAt: Date;
  participants: Set<Snowflake>;
  streams: Collection<Snowflake, ActiveStream>;
  folder: string;
}

export class VoiceRecordingService {
  private readonly sessions = new Collection<Snowflake, RecordingSession>();

  constructor(
    private readonly logger: Logger,
    private readonly repository: VoiceRecordRepository,
    private readonly config: AppConfig
  ) {}

  public async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!this.config.features.voiceRecording) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldChannel?.id === newChannel?.id) return;

    if (newChannel) {
      await this.ensureSession(newChannel);
      await this.addParticipant(newChannel, newState.id);
    }

    if (oldChannel) {
      await this.removeParticipant(oldChannel, newState.id);
    }
  }

  private async ensureSession(channel: VoiceBasedChannel): Promise<void> {
    if (this.sessions.has(channel.id)) return;

    if (!existsSync(this.config.paths.recordings)) {
      await mkdir(this.config.paths.recordings, { recursive: true });
    }

    const startedAt = new Date();
    const folder = this.buildSessionFolder(channel.guild, channel.id, startedAt);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true
    });

    await this.awaitConnectionReady(connection);

    const session: RecordingSession = {
      id: randomUUID(),
      guild: channel.guild,
      channel,
      connection,
      startedAt,
      participants: new Set(),
      streams: new Collection(),
      folder
    };

    this.sessions.set(channel.id, session);
    this.logger.info('Started recording session %s in channel %s', session.id, channel.id);
  }

  private async awaitConnectionReady(connection: VoiceConnection) {
    if (connection.state.status === VoiceConnectionStatus.Ready) return;

    await new Promise<void>((resolveConnection, rejectConnection) => {
      const cleanup = () => {
        connection.off(VoiceConnectionStatus.Ready, onReady);
        connection.off('error', onError);
      };

      const onReady = () => {
        cleanup();
        resolveConnection();
      };

      const onError = (error: Error) => {
        cleanup();
        rejectConnection(error);
      };

      connection.once(VoiceConnectionStatus.Ready, onReady);
      connection.once('error', onError);
    });
  }

  private buildSessionFolder(guild: Guild, channelId: Snowflake, startedAt: Date): string {
    const date = startedAt.toISOString().split('T')[0];
    const baseFolder = resolve(this.config.paths.recordings, guild.id, date, channelId);

    if (!existsSync(baseFolder)) {
      mkdir(baseFolder, { recursive: true }).catch((error) => this.logger.error('Failed to prepare recording folder: %o', error));
    }

    return baseFolder;
  }

  private buildRecordingPath(session: RecordingSession, userId: Snowflake): string {
    const filename = `${userId}-${session.id}.pcm`;

    return joinPath(session.folder, filename);
  }

  private async addParticipant(channel: VoiceBasedChannel, userId: Snowflake): Promise<void> {
    const session = this.sessions.get(channel.id);
    if (!session || session.streams.has(userId)) return;

    session.participants.add(userId);

    const subscription = session.connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 500 }
    });

    const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
    const outputPath = this.buildRecordingPath(session, userId);
    const fileStream = createWriteStream(outputPath);

    const stop = async () => {
      subscription.destroy();
      decoder.destroy();
      fileStream.end();
    };

    session.streams.set(userId, { userId, outputPath, startedAt: new Date(), stop });

    pipeline(subscription, decoder, fileStream).catch((error) => {
      this.logger.error('Recording pipeline error for user %s in channel %s: %o', userId, channel.id, error);
    });
  }

  private async removeParticipant(channel: VoiceBasedChannel, userId: Snowflake): Promise<void> {
    const session = this.sessions.get(channel.id);
    if (!session) return;

    session.participants.delete(userId);
    const stream = session.streams.get(userId);

    if (stream) {
      await stream.stop();
      session.streams.delete(userId);
    }

    const stillInChannel = channel.members.filter((member) => !member.user.bot).size;
    if (stillInChannel === 0) {
      await this.stopSession(session);
    }
  }

  private async stopSession(session: RecordingSession): Promise<void> {
    this.sessions.delete(session.channel.id);

    for (const stream of session.streams.values()) {
      await stream.stop();
    }

    session.connection.destroy();

    const endedAt = new Date();
    const duration = (endedAt.getTime() - session.startedAt.getTime()) / 1000;

    await this.repository.create({
      guildId: session.guild.id,
      channelId: session.channel.id,
      startedAt: session.startedAt,
      endedAt,
      duration,
      participants: Array.from(session.participants),
      filePath: session.folder,
      metadata: {
        sessionId: session.id
      }
    });

    this.logger.info('Recording session %s has ended after %d seconds with %d participants.', session.id, duration, session.participants.size);
  }
}
