#!/usr/bin/env node

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || '00000000-0000-0000-0000-000000000001';
const DEFAULTS = { quotes: 1000, conversions: 1000, concurrency: 500 };

function parseOptions(args) {
  const options = { ...DEFAULTS };

  for (let index = 0; index < args.length; index += 1) {
    const [option, inlineValue] = args[index].split('=');
    if (option === '--help' || option === '-h') {
      printUsage();
      process.exit(0);
    }

    const names = { '--quotes': 'quotes', '--conversions': 'conversions', '--concurrency': 'concurrency' };
    const name = names[option];
    if (!name) {
      throw new Error(`Unknown option: ${option}`);
    }

    const value = inlineValue ?? args[index + 1];
    if (value == null || value.startsWith('--')) {
      throw new Error(`Missing value for ${option}`);
    }
    if (inlineValue == null) index += 1;

    const parsed = Number(value);
    const minimum = name === 'concurrency' ? 1 : 0;
    if (!Number.isSafeInteger(parsed) || parsed < minimum) {
      throw new Error(`${option} must be an integer greater than or equal to ${minimum}`);
    }
    options[name] = parsed;
  }

  if (options.conversions > options.quotes) {
    throw new Error('--conversions cannot exceed --quotes; each conversion requires its own quote');
  }
  return options;
}

function printUsage() {
  console.log(`Usage: node scripts/test-charge.js [options]

Options:
  --quotes <number>       Number of quotes to create (default: ${DEFAULTS.quotes})
  --conversions <number>  Number of conversions to create (default: ${DEFAULTS.conversions})
  --concurrency <number>  Maximum simultaneous requests (default: ${DEFAULTS.concurrency})
  -h, --help              Show this help

Environment:
  API_URL                 API base URL (default: http://localhost:3000)
  USER_ID                 User ID for conversions`);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const runId = `${Date.now()}-${crypto.randomUUID()}`;
  const startedAt = performance.now();

  console.log(`Load test on ${API_URL}`);
  console.log(`Creating ${options.quotes} quotes and ${options.conversions} conversions (concurrency: ${options.concurrency})`);

  const quoteResults = new Array(options.quotes);
  const conversionResults = new Array(options.conversions);

  await runConcurrent(options.quotes, options.concurrency, async (index) => {
    const result = await postJson('/quotes', {
      amount: 100,
      sourceCurrency: 'GBP',
      targetCurrency: 'USD',
    });

    if (!result.ok) {
      quoteResults[index] = { ...result, index: index + 1, quoteId: null };
      if (index < options.conversions) {
        conversionResults[index] = {
          ok: false,
          attempted: false,
          status: null,
          durationMs: 0,
          error: 'Skipped because quote creation failed',
          index: index + 1,
        };
      }
      return;
    }

    let quote;
    try {
      quote = JSON.parse(result.body);
    } catch {
      quoteResults[index] = { ...result, ok: false, error: 'Response was not valid JSON', index: index + 1, quoteId: null };
      if (index < options.conversions) {
        conversionResults[index] = {
          ok: false,
          attempted: false,
          status: null,
          durationMs: 0,
          error: 'Skipped because quote response was invalid',
          index: index + 1,
        };
      }
      return;
    }
    if (!quote.id) {
      quoteResults[index] = { ...result, ok: false, error: `Quote response did not include an id: ${result.body}`, index: index + 1, quoteId: null };
      if (index < options.conversions) {
        conversionResults[index] = {
          ok: false,
          attempted: false,
          status: null,
          durationMs: 0,
          error: 'Skipped because quote response did not include an id',
          index: index + 1,
        };
      }
      return;
    }

    quoteResults[index] = { ...result, index: index + 1, quoteId: quote.id };
    if (index >= options.conversions) return;

    const conversionResult = await postJson('/conversions', {
      userId: USER_ID,
      quoteId: quote.id,
    }, {
      'X-Idempotency-Key': `test-charge-${runId}-${index + 1}-${quote.id}`,
    });
    conversionResults[index] = {
      ...conversionResult,
      attempted: true,
      index: index + 1,
      quoteId: quote.id,
    };
  });

  printResults('Quotes', quoteResults);
  printResults('Conversions', conversionResults);
  const elapsedMs = performance.now() - startedAt;
  const failures = [...quoteResults, ...conversionResults].filter((result) => !result.ok).length;
  const attemptedRequests =
    options.quotes + conversionResults.filter((result) => result.attempted).length;
  const throughput = elapsedMs > 0 ? (attemptedRequests / (elapsedMs / 1000)).toFixed(2) : 'n/a';
  console.log(`\nTotal elapsed: ${formatMs(elapsedMs)}; throughput: ${throughput} requests/s`);

  if (failures > 0) {
    throw new Error(`${failures} request(s) failed or were skipped`);
  }
}

async function postJson(path, body, extraHeaders = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: text,
      durationMs: performance.now() - startedAt,
      error: response.ok ? null : `HTTP ${response.status}: ${text}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: '',
      durationMs: performance.now() - startedAt,
      error: error.message || String(error),
    };
  }
}

async function runConcurrent(count, concurrency, task) {
  const results = new Array(count);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= count) return;
      results[index] = await task(index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(count, concurrency) }, () => worker()));
  return results;
}

function printResults(label, results) {
  const successes = results.filter((result) => result.ok);
  const failures = results.filter((result) => !result.ok);
  const durations = results
    .filter((result) => result.attempted !== false)
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);
  const average = durations.length
    ? durations.reduce((total, duration) => total + duration, 0) / durations.length
    : 0;
  const p95 = durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : 0;

  console.log(`\n${label}: ${successes.length} succeeded, ${failures.length} failed`);
  console.log(`Latency: average ${formatMs(average)}, p95 ${formatMs(p95)}`);
  failures.forEach((result) => {
    console.error(`  request ${result.index}: ${result.error}`);
  });
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

main().catch((error) => {
  console.error('Error:', error.message || error);
  process.exitCode = 1;
});
