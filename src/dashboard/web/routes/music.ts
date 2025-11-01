import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const guild = req.app.locals.bot.guilds.cache.first();

  if (!guild) {
    res.render('music', { queue: [], current: null });
    return;
  }

  const musicService = req.app.locals.bot.services.music;
  const current = musicService.nowPlaying(guild);
  const queue = musicService.queue(guild);

  res.render('music', { current, queue });
});

export default router;
