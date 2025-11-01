import type { Logger } from 'winston';

export const registerProcessErrorHandlers = (logger: Logger) => {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection detected: %o', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception detected: %o', error);
  });
};
