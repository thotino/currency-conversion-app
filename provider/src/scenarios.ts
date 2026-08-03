import { Rng } from './prng';

export type ScenarioName =
  | 'happy_path'
  | 'duplicate_webhook'
  | 'early_webhook'
  | 'out_of_order'
  | 'reject'
  | 'error_after_accept';

export const SCENARIO_NAMES: ScenarioName[] = [
  'happy_path',
  'duplicate_webhook',
  'early_webhook',
  'out_of_order',
  'reject',
  'error_after_accept',
];

export interface Behavior {
  latencyMs: number;
  reject: boolean;
  errorAfterAccept: boolean;
  earlyWebhook: boolean;
  duplicateWebhook: boolean;
  outOfOrder: boolean;
  reasonCode: string;
}

const REASON_CODES: string[] = [
  'INSUFFICIENT_FUNDS',
  'COMPLIANCE_HOLD',
  'RATE_EXPIRED',
  'LIMIT_EXCEEDED',
  'COUNTERPARTY_UNAVAILABLE',
];

export function isScenarioName(
  value: string | undefined,
): value is ScenarioName {
  return value !== undefined && (SCENARIO_NAMES as string[]).includes(value);
}

/**
 * Draws the behaviour for one incoming order.
 *
 * The full set of random values is always consumed, even when an override is
 * given, so the seeded stream stays at the same position for a given number of
 * calls regardless of any per-request override.
 */
export function decideBehavior(rng: Rng, override?: ScenarioName): Behavior {
  const dLatency = rng();
  const dReject = rng();
  const dError = rng();
  const dEarly = rng();
  const dDuplicate = rng();
  const dOutOfOrder = rng();
  const dReason = rng();

  const latencyMs = Math.floor(30 + dLatency * dLatency * 3970);
  const reasonCode =
    REASON_CODES[Math.floor(dReason * REASON_CODES.length)] ?? REASON_CODES[0];

  if (override === undefined) {
    return {
      latencyMs,
      reject: dReject < 1 / 12,
      errorAfterAccept: dError < 0.1,
      earlyWebhook: dEarly < 0.15,
      duplicateWebhook: dDuplicate < 0.15,
      outOfOrder: dOutOfOrder < 0.15,
      reasonCode,
    };
  }

  const base: Behavior = {
    latencyMs: override === 'happy_path' ? 60 : latencyMs,
    reject: false,
    errorAfterAccept: false,
    earlyWebhook: false,
    duplicateWebhook: false,
    outOfOrder: false,
    reasonCode,
  };

  switch (override) {
    case 'reject':
      return { ...base, reject: true };
    case 'error_after_accept':
      return { ...base, errorAfterAccept: true };
    case 'early_webhook':
      return { ...base, earlyWebhook: true };
    case 'duplicate_webhook':
      return { ...base, duplicateWebhook: true };
    case 'out_of_order':
      return { ...base, outOfOrder: true };
    case 'happy_path':
    default:
      return base;
  }
}
