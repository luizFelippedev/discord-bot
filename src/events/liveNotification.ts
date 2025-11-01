import type { EventModule } from '../types/events.js';

const event: EventModule<'presenceUpdate'> = {
  name: 'presenceUpdate',
  async execute(oldPresence, newPresence) {
    await newPresence.client.services.liveDetection.handlePresenceUpdate(oldPresence, newPresence);
  }
};

export default event;
