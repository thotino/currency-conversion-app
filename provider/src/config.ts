export interface ProviderConfig {
  port: number;
  seed: number;
  webhookUrl: string;
}

export function loadConfig(): ProviderConfig {
  return {
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000,
    seed: process.env.PROVIDER_SEED
      ? Number.parseInt(process.env.PROVIDER_SEED, 10)
      : 424242,
    webhookUrl: process.env.WEBHOOK_URL ?? 'http://api:3000/webhooks/provider',
  };
}
