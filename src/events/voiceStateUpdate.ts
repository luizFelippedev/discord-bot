import type { EventModule } from '../types/events.js';

const event: EventModule<'voiceStateUpdate'> = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const client = oldState.client;
    await client.services.voiceRecording.handleVoiceStateUpdate(oldState, newState);
  }
};

export default event;
