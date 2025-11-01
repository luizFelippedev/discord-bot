import { Router } from 'express';
import { WarningRepository } from '../../../database/repositories/warningRepository.js';

const router = Router();
const warningRepository = new WarningRepository();

router.get('/', async (req, res) => {
  const guild = req.app.locals.bot.guilds.cache.first();

  if (!guild) {
    res.render('moderation', { warnings: [] });
    return;
  }

  const warnings = await warningRepository.findRecent(guild.id, 20);
  res.render('moderation', { warnings });
});

export default router;
