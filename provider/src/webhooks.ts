import { ProviderConfig } from './config';
import { getRate } from './rates';
import { Behavior } from './scenarios';
import { ProviderConversion, updateConversion } from './store';

interface WebhookEvent {
  eventId: string;
  eventType: string;
  providerRef: string;
  occurredAt: string;
  data: Record<string, unknown>;
}

async function deliver(url: string, event: WebhookEvent): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    console.log(`[webhook] sent ${event.eventType} (${event.eventId})`);
  } catch (error) {
    console.error(`[webhook] delivery failed for ${event.eventId}:`, error);
  }
}

/**
 * Schedules the asynchronous webhook deliveries for an order. Timings are
 * derived from the behaviour so the acceptance and terminal events can arrive
 * early, out of order, or more than once.
 */
export function scheduleWebhooks(
  config: ProviderConfig,
  conversion: ProviderConversion,
  behavior: Behavior,
): void {
  const {
    providerRef,
    externalReference,
    sourceCurrency,
    targetCurrency,
    sourceAmount,
  } = conversion;

  let acceptDelay = behavior.latencyMs + 300;
  let terminalDelay = acceptDelay + 900;

  if (behavior.earlyWebhook) {
    acceptDelay = Math.max(10, Math.floor(behavior.latencyMs / 2));
    terminalDelay = behavior.latencyMs + 900;
  }

  if (behavior.outOfOrder) {
    terminalDelay = behavior.latencyMs + 300;
    acceptDelay = terminalDelay + 900;
  }

  setTimeout(() => {
    updateConversion(providerRef, { status: 'accepted' });
    void deliver(config.webhookUrl, {
      eventId: `evt_${providerRef}_accepted`,
      eventType: 'conversion.accepted',
      providerRef,
      occurredAt: new Date().toISOString(),
      data: {
        providerRef,
        externalReference,
        status: 'accepted',
        sourceCurrency,
        targetCurrency,
        sourceAmount,
      },
    });
  }, acceptDelay);

  const sendTerminal = (): void => {
    let event: WebhookEvent;

    if (behavior.reject) {
      updateConversion(providerRef, {
        status: 'rejected',
        reasonCode: behavior.reasonCode,
      });
      event = {
        eventId: `evt_${providerRef}_rejected`,
        eventType: 'conversion.rejected',
        providerRef,
        occurredAt: new Date().toISOString(),
        data: {
          providerRef,
          externalReference,
          status: 'rejected',
          reasonCode: behavior.reasonCode,
        },
      };
    } else {
      const rate = getRate(sourceCurrency, targetCurrency, Date.now());
      const targetAmount = Math.round(sourceAmount * rate * 100) / 100;
      updateConversion(providerRef, { status: 'executed', rate, targetAmount });
      event = {
        eventId: `evt_${providerRef}_executed`,
        eventType: 'conversion.executed',
        providerRef,
        occurredAt: new Date().toISOString(),
        data: {
          providerRef,
          externalReference,
          status: 'executed',
          sourceCurrency,
          targetCurrency,
          sourceAmount,
          rate,
          targetAmount,
        },
      };
    }

    void deliver(config.webhookUrl, event);

    if (behavior.duplicateWebhook) {
      setTimeout(() => {
        void deliver(config.webhookUrl, { ...event });
      }, 3000);
    }
  };

  setTimeout(sendTerminal, terminalDelay);
}
