import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Ensure that the directory for the provided path exists.
 * When the path points to a file, pass `createLeaf` as false to create only the parent directories.
 */
export const ensureDirectory = (pathLike: string, createLeaf = true): string => {
  const resolvedPath = resolve(pathLike);
  const target = createLeaf ? resolvedPath : dirname(resolvedPath);

  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  return resolvedPath;
};
