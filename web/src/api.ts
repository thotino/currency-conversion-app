const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const USER_ID = "00000000-0000-0000-0000-000000000001";
export async function getHealth(): Promise<unknown> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function postQuotes(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
) {
  const response = await fetch(`${API_URL}/quotes`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({
      amount,
      sourceCurrency,
      targetCurrency,
    }),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function postConversions(
  source: { amount: number; currency: string },
  target: { amount: number; currency: string },
  fees: { amount: number; currency: string },
  rate: number,
  expiration: string,
) {
  const date = new Date().toISOString().split("T")[0];
  const response = await fetch(`${API_URL}/conversions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-IDEMPOTENCY-KEY": `conversion-${USER_ID}-${date}-${source.amount}-${source.currency}-${target.currency}}`,
    },
    body: JSON.stringify({
      userId: USER_ID,
      source,
      target,
      fees,
      rate,
      expiration,
    }),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function getConversions(userId: string = USER_ID) {
  const response = await fetch(`${API_URL}/conversions?userId=${userId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
