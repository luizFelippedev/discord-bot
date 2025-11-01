import { Router, type Request, type Response } from 'express';
import { VoiceRecordRepository } from '../../../database/repositories/recordRepository.js';

const router = Router();
const voiceRecordRepository = new VoiceRecordRepository();

router.get('/', async (req: Request, res: Response) => {
  const guild = req.app.locals.bot.guilds.cache.first();

  if (!guild) {
    res.render('analytics', { data: null });
    return;
  }

  const economy = await req.app.locals.bot.services.economy.leaderboard(guild.id, 10);
  const leveling = await req.app.locals.bot.services.leveling.getLeaderboard(guild.id, 10);
  const recordings = await voiceRecordRepository.findByGuild(guild.id, 10);

  res.render('analytics', {
    data: {
      economy,
      leveling,
      recordings
    }
  });
});

export default router;
