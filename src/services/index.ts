import type { Client } from 'discord.js';
import { MusicService } from './musicService.js';
import { VoiceRecordRepository } from '../database/repositories/recordRepository.js';
import { VoiceRecordingService } from './voiceRecordingService.js';
import { LiveDetectionService } from './liveDetectionService.js';
import { ModerationService } from './moderationService.js';
import { RegistrationService } from './registrationService.js';
import { DashboardService } from './dashboardService.js';
import { EconomyService } from './economyService.js';
import { LevelingService } from './levelingService.js';

export interface ServiceRegistry {
  music: MusicService;
  voiceRecording: VoiceRecordingService;
  liveDetection: LiveDetectionService;
  moderation: ModerationService;
  registration: RegistrationService;
  dashboard: DashboardService;
  economy: EconomyService;
  leveling: LevelingService;
}

export const createServices = (client: Client): ServiceRegistry => {
  const voiceRecordRepository = new VoiceRecordRepository();

  return {
    music: new MusicService(client.logger),
    voiceRecording: new VoiceRecordingService(client.logger, voiceRecordRepository, client.config),
    liveDetection: new LiveDetectionService(client.logger),
    moderation: new ModerationService(client.logger),
    registration: new RegistrationService(),
    dashboard: new DashboardService(),
    economy: new EconomyService(client.logger),
    leveling: new LevelingService()
  };
};
