#!/usr/bin/env node

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log(`Creating quote on ${API_URL}/quotes...`);

  const quoteResponse = await fetch(`${API_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 100,
      sourceCurrency: 'GBP',
      targetCurrency: 'USD',
    }),
  });

  if (!quoteResponse.ok) {
    const body = await quoteResponse.text();
    throw new Error(`Quote creation failed (${quoteResponse.status}): ${body}`);
  }

  const quote = await quoteResponse.json();
  const quoteId = quote.id;
  if (!quoteId) {
    throw new Error(`Quote response did not include an id: ${JSON.stringify(quote)}`);
  }

  const idempotencyKey = `test-idempotence-${USER_ID}-${quoteId}`;
  console.log(`Quote created: ${quoteId}`);
  console.log(`Running 10 parallel POST requests to ${API_URL}/conversions with X-Idempotency-Key=${idempotencyKey}`);

  const requests = Array.from({ length: 10 }, (_, index) => sendConversionRequest(index + 1, quoteId, idempotencyKey));
  const results = await Promise.all(requests);

  console.log('\nResults:');
  results.forEach((result) => {
    console.log(`--- request ${result.index} ---`);
    console.log(`status: ${result.status}`);
    console.log(`body: ${result.body}`);
  });
}

async function sendConversionRequest(index, quoteId, idempotencyKey) {
  const response = await fetch(`${API_URL}/conversions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ 
      userId: USER_ID, 
      quoteId 
    }),
  });

  const text = await response.text();
  return {
    index,
    status: response.status,
    body: text,
  };
}

main().catch((error) => {
  console.error('Error:', error.message || error);
  process.exit(1);
});
