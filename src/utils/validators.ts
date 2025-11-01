export const ensureRange = (value: number, min: number, max: number, message: string) => {
  if (value < min || value > max) {
    throw new Error(message);
  }
};

export const ensureTruthy = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
};
