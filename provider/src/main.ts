import express, { Request, Response } from 'express';
import { loadConfig } from './config';
import { mulberry32 } from './prng';
import { allRates, isCurrency } from './rates';
import { decideBehavior, isScenarioName } from './scenarios';
import { getConversion, saveConversion } from './store';
import { scheduleWebhooks } from './webhooks';

const config = loadConfig();
const rng = mulberry32(config.seed);
let counter = 0;

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/v1/rates', (_req: Request, res: Response) => {
  res.json({
    base: 'EUR',
    asOf: new Date().toISOString(),
    rates: allRates(Date.now()),
  });
});

app.get('/v1/conversions/:providerRef', (req: Request, res: Response) => {
  const conversion = getConversion(req.params.providerRef);
  if (!conversion) {
    return res.status(404).json({ error: 'not_found' });
  }
  return res.json(conversion);
});

app.post('/v1/conversions', (req: Request, res: Response) => {
  const body: unknown = req.body;
  const { amount, sourceCurrency, targetCurrency, externalReference } =
    (body as Record<string, unknown>) ?? {};

  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !isCurrency(sourceCurrency) ||
    !isCurrency(targetCurrency) ||
    typeof externalReference !== 'string' ||
    externalReference.length === 0
  ) {
    return res.status(400).json({
      error: 'invalid_request',
      message:
        'amount (positive number), sourceCurrency, targetCurrency and externalReference are required',
    });
  }

  const scenarioHeader = req.header('X-Test-Scenario');
  const override = isScenarioName(scenarioHeader) ? scenarioHeader : undefined;
  const behavior = decideBehavior(rng, override);

  counter += 1;
  const providerRef = `prv_${String(counter).padStart(8, '0')}`;
  const now = new Date().toISOString();

  const conversion = {
    providerRef,
    externalReference,
    sourceCurrency,
    targetCurrency,
    sourceAmount: amount,
    status: 'accepted' as const,
    rate: null,
    targetAmount: null,
    reasonCode: null,
    createdAt: now,
    updatedAt: now,
  };

  // The order is recorded immediately and the webhooks are scheduled, even when
  // this request is answered with an error status.
  saveConversion(conversion);
  scheduleWebhooks(config, conversion, behavior);

  setTimeout(() => {
    if (behavior.errorAfterAccept) {
      return res.status(502).json({ error: 'upstream_error' });
    }
    return res.status(202).json({ providerRef });
  }, behavior.latencyMs);
});

app.listen(config.port, () => {
  console.log(
    `[provider] listening on port ${config.port} (seed=${config.seed})`,
  );
});
