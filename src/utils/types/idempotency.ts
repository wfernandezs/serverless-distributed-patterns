export type LocalIdempotencyConfig = {
  eventKeyJmesPath?: string;
  expiresAfterSeconds?: number;
  throwOnNoIdempotencyKey?: boolean;
};
