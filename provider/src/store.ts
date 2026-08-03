import { Currency } from './rates';

export type ProviderStatus = 'accepted' | 'executed' | 'rejected';

export interface ProviderConversion {
  providerRef: string;
  externalReference: string;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  sourceAmount: number;
  status: ProviderStatus;
  rate: number | null;
  targetAmount: number | null;
  reasonCode: string | null;
  createdAt: string;
  updatedAt: string;
}

const conversions = new Map<string, ProviderConversion>();

export function saveConversion(conversion: ProviderConversion): void {
  conversions.set(conversion.providerRef, conversion);
}

export function getConversion(
  providerRef: string,
): ProviderConversion | undefined {
  return conversions.get(providerRef);
}

export function updateConversion(
  providerRef: string,
  patch: Partial<ProviderConversion>,
): void {
  const existing = conversions.get(providerRef);
  if (!existing) {
    return;
  }
  conversions.set(providerRef, {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}
