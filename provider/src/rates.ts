export type Currency = 'EUR' | 'USD' | 'GBP';

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP'];

// Units of each currency per 1 EUR (mid-market anchor).
const ANCHOR: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
};

export function isCurrency(value: unknown): value is Currency {
  return value === 'EUR' || value === 'USD' || value === 'GBP';
}

function pairPhase(from: Currency, to: Currency): number {
  const key = `${from}${to}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return (((h % 360) + 360) % 360) * (Math.PI / 180);
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Current rate for `from -> to`, with a slow, deterministic drift over time. */
export function getRate(from: Currency, to: Currency, atMs: number): number {
  if (from === to) {
    return 1;
  }
  const base = ANCHOR[to] / ANCHOR[from];
  const seconds = atMs / 1000;
  const variation = 1 + 0.015 * Math.sin(seconds / 180 + pairPhase(from, to));
  return round6(base * variation);
}

export function allRates(atMs: number): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const from of CURRENCIES) {
    for (const to of CURRENCIES) {
      if (from === to) {
        continue;
      }
      rates[`${from}/${to}`] = getRate(from, to, atMs);
    }
  }
  return rates;
}
