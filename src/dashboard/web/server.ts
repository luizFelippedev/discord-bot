import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy, type Profile } from 'passport-discord';
import type { Client } from 'discord.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rateLimit } from './middleware/rateLimit.js';
import { ensureAuthenticated } from './middleware/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import analyticsRoutes from './routes/analytics.js';
import moderationRoutes from './routes/moderation.js';
import musicRoutes from './routes/music.js';
import type { DashboardUser } from './types.js';

type SerializedUser = DashboardUser;

export const startDashboard = (client: Client) => {
  const app = express();
  const config = client.config;

  if (!config.features.dashboard) {
    client.logger.info('Dashboard feature disabled.');
    return;
  }

  passport.serializeUser((user: SerializedUser, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj: SerializedUser, done) => {
    done(null, obj);
  });

  passport.use(
    new DiscordStrategy(
      {
        clientID: config.discord.clientId,
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? process.env.CLIENT_SECRET ?? '',
        callbackURL: config.dashboard.callbackUrl,
        scope: ['identify', 'guilds']
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        const user = {
          id: profile.id,
          username: profile.username,
          avatar: profile.avatar
        };

        done(null, user);
      }
    )
  );

  const __dirname = dirname(fileURLToPath(import.meta.url));
  app.set('view engine', 'ejs');
  app.set('views', resolve(__dirname, '../templates'));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    session({
      secret: config.dashboard.sessionSecret,
      resave: false,
      saveUninitialized: false
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(rateLimit);
  app.locals.bot = client;

  app.get('/login', passport.authenticate('discord'));
  app.get(
    '/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (_req, res) => {
      res.redirect('/dashboard');
    }
  );

  app.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.use((_req, res, next) => {
    res.locals.bot = client;
    next();
  });

  app.get('/', (_req, res) => {
    res.render('home', { guilds: client.guilds.cache.size, users: client.users.cache.size });
  });

  app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
  app.use('/analytics', ensureAuthenticated, analyticsRoutes);
  app.use('/moderation', ensureAuthenticated, moderationRoutes);
  app.use('/music', ensureAuthenticated, musicRoutes);

  app.listen(config.dashboard.port, () => {
    client.logger.info('Dashboard disponível em http://localhost:%d', config.dashboard.port);
  });
};
