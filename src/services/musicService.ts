import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus
} from '@discordjs/voice';
import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Snowflake,
  TextChannel
} from 'discord.js';
import { Collection } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';
import type { Logger } from 'winston';
import play from 'play-dl';

interface Track {
  title: string;
  url: string;
  duration: number;
  requestedBy: string;
  onStart?: () => void;
  onFinish?: () => void;
}

type LoopMode = 'off' | 'track' | 'queue';

class GuildMusicManager {
  public readonly guildId: Snowflake;
  public readonly queue: Track[] = [];
  public volume = 0.5;
  public loop: LoopMode = 'off';
  private connection: VoiceConnection | null = null;
  private currentTrack: Track | null = null;
  private readonly player: AudioPlayer;
  private readyLock = false;
  private textChannel: TextChannel | null = null;

  constructor(private readonly guild: Guild, private readonly logger: Logger) {
    this.guildId = guild.id;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (!this.currentTrack) return;
      this.currentTrack.onFinish?.();
      const finished = this.currentTrack;
      this.currentTrack = null;
      this.next(finished);
    });

    this.player.on('error', (error) => {
      this.logger.error('Audio player error in guild %s: %o', this.guildId, error);
      this.player.stop(true);
      this.next();
    });
  }

  public setTextChannel(channel: TextChannel) {
    this.textChannel = channel;
  }

  public async connect(member: GuildMember): Promise<void> {
    const channel = member.voice.channel;

    if (!channel) {
      throw new Error('Você precisa estar em um canal de voz para usar comandos de música.');
    }

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });

    this.connection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          try {
            await entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000);
          } catch {
            this.connection?.destroy();
          }
        } else if (newState.reason === VoiceConnectionDisconnectReason.Manual) {
          this.connection?.destroy();
        } else {
          await wait(5_000);
          if (this.connection?.state.status !== VoiceConnectionStatus.Destroyed) {
            this.connection?.destroy();
          }
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stop(true);
      }
    });

    await entersState(this.connection, VoiceConnectionStatus.Ready, 15_000);
    this.connection.subscribe(this.player);
  }

  public async enqueue(track: Track): Promise<void> {
    this.queue.push(track);
    if (!this.currentTrack) {
      await this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (this.currentTrack || this.queue.length === 0) {
      return;
    }

    const track = this.loop === 'track' && this.currentTrack ? this.currentTrack : this.queue.shift()!;

    if (this.loop === 'queue' && track) {
      this.queue.push(track);
    }

    if (!track) {
      return;
    }

    try {
      this.currentTrack = track;
      const stream = await play.stream(track.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type === StreamType.Arbitrary ? StreamType.Arbitrary : StreamType.Opus,
        inlineVolume: true
      });

      resource.volume?.setVolume(this.volume);

      track.onStart?.();
      this.player.play(resource);
    } catch (error) {
      this.logger.error('Failed to play track %s in guild %s: %o', track.url, this.guildId, error);
      this.currentTrack = null;
      await this.processQueue();
      throw error;
    }
  }

  public pause(): boolean {
    return this.player.pause();
  }

  public resume(): boolean {
    return this.player.unpause();
  }

  public skip(): boolean {
    return this.player.stop(true);
  }

  public stop(clearQueue = false): void {
    if (clearQueue) {
      this.queue.length = 0;
    }

    this.player.stop(true);
    this.currentTrack = null;
  }

  public disconnect(): void {
    this.queue.length = 0;
    this.player.stop(true);
    this.connection?.destroy();
    this.connection = null;
  }

  public setVolume(volume: number): void {
    this.volume = volume;
    const resource = this.player.state.status === AudioPlayerStatus.Playing ? this.player.state.resource : null;
    resource?.volume?.setVolume(volume);
  }

  public shuffleQueue(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public setLoop(mode: LoopMode) {
    this.loop = mode;
  }

  private next(previous?: Track | null) {
    if (this.loop === 'track' && previous) {
      this.queue.unshift(previous);
    }

    void this.processQueue();
  }
}

export class MusicService {
  private readonly managers = new Collection<Snowflake, GuildMusicManager>();

  constructor(private readonly logger: Logger) {}

  private resolveManager(guild: Guild): GuildMusicManager {
    let manager = this.managers.get(guild.id);

    if (!manager) {
      manager = new GuildMusicManager(guild, this.logger);
      this.managers.set(guild.id, manager);
    }

    return manager;
  }

  public async play(interaction: ChatInputCommandInteraction, query: string) {
    const member = interaction.member as GuildMember;

    if (!member || !member.voice.channel) {
      throw new Error('Você precisa estar em um canal de voz para tocar músicas.');
    }

    const manager = this.resolveManager(member.guild);
    await manager.connect(member);

    const track = await this.resolveTrack(query, member);
    manager.setTextChannel(interaction.channel as TextChannel);

    await manager.enqueue(track);

    return {
      track,
      queue: manager.queue
    };
  }

  public pause(guild: Guild): boolean {
    return this.resolveManager(guild).pause();
  }

  public resume(guild: Guild): boolean {
    return this.resolveManager(guild).resume();
  }

  public skip(guild: Guild): boolean {
    return this.resolveManager(guild).skip();
  }

  public stop(guild: Guild): void {
    this.resolveManager(guild).stop(true);
  }

  public disconnect(guild: Guild): void {
    const manager = this.resolveManager(guild);
    manager.disconnect();
    this.managers.delete(guild.id);
  }

  public nowPlaying(guild: Guild): Track | null {
    return this.resolveManager(guild).getCurrentTrack();
  }

  public setVolume(guild: Guild, volume: number): void {
    this.resolveManager(guild).setVolume(volume);
  }

  public shuffle(guild: Guild): void {
    this.resolveManager(guild).shuffleQueue();
  }

  public queue(guild: Guild): Track[] {
    return this.resolveManager(guild).queue;
  }

  public setLoop(guild: Guild, mode: LoopMode): void {
    this.resolveManager(guild).setLoop(mode);
  }

  public remove(guild: Guild, position: number): Track | null {
    const manager = this.resolveManager(guild);
    if (position < 1 || position > manager.queue.length) return null;
    const [removed] = manager.queue.splice(position - 1, 1);
    return removed ?? null;
  }

  public async search(query: string, limit = 5): Promise<Track[]> {
    const searchResults = await play.search(query, { limit, source: { youtube: 'video' } });
    return searchResults.map((result) => ({
      title: result.title ?? 'Unknown title',
      url: result.url ?? '',
      duration: Number(result.durationInSec ?? 0),
      requestedBy: 'Search'
    }));
  }

  private async resolveTrack(query: string, member: GuildMember): Promise<Track> {
    try {
      if (play.yt_validate(query) === 'video') {
        const info = await play.video_info(query);
        const details = info.video_details;

        return {
          title: details.title ?? 'Unknown title',
          url: details.url ?? query,
          duration: Number(details.durationInSec ?? 0),
          requestedBy: member.displayName,
          onStart: () => {
            this.logger.info('Now playing %s in guild %s', details.title, member.guild.id);
          }
        };
      }

      const search = await play.search(query, { limit: 1, source: { youtube: 'video' } });
      const result = search[0];

      if (!result) {
        throw new Error('Nenhum resultado encontrado para a busca solicitada.');
      }

      return {
        title: result.title ?? 'Unknown title',
        url: result.url ?? query,
        duration: Number(result.durationInSec ?? 0),
        requestedBy: member.displayName,
        onStart: () => {
          this.logger.info('Now playing %s in guild %s', result.title, member.guild.id);
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch track data for "%s": %o', query, error);
      throw new Error('Não foi possível localizar essa música. Tente outro link ou nome.');
    }
  }
}
