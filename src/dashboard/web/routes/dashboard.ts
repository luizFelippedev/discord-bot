import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const guild = req.app.locals.bot.guilds.cache.first();

  if (!guild) {
    res.render('dashboard', { overview: null });
    return;
  }

  const overview = await req.app.locals.bot.services.dashboard.getOverview(guild);
  res.render('dashboard', { overview });
});

export default router;
