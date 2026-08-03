# Partner API — Currency Conversion

Version 1 · Base URL `http://provider:4000`

This document describes how to integrate with our currency conversion service.
An order is submitted over HTTP and settled asynchronously: the outcome of an
order is delivered to your webhook endpoint, never in the response to the
submission call.

All request and response bodies are JSON. No authentication is required in this
sandbox environment.

---

## Rates

### `GET /v1/rates`

Returns the current indicative rates. Rates move continuously; a rate read here
is informational and is not a guarantee of the rate applied at execution.

**Response `200`**

```json
{
  "base": "EUR",
  "asOf": "2026-01-01T12:00:00.000Z",
  "rates": {
    "EUR/USD": 1.081234,
    "EUR/GBP": 0.849218,
    "USD/EUR": 0.925102,
    "USD/GBP": 0.786541,
    "GBP/EUR": 1.177238,
    "GBP/USD": 1.271004
  }
}
```

Supported currencies: `EUR`, `USD`, `GBP`.

---

## Orders

### `POST /v1/conversions`

Submits a conversion order. The response confirms that the order has been
**received for processing** and returns our reference for it. It does not carry
the execution result.

**Request body**

| Field               | Type   | Description                                        |
| ------------------- | ------ | -------------------------------------------------- |
| `amount`            | number | Amount to convert, in the source currency. `> 0`.  |
| `sourceCurrency`    | string | One of `EUR`, `USD`, `GBP`.                        |
| `targetCurrency`    | string | One of `EUR`, `USD`, `GBP`.                        |
| `externalReference` | string | Your own reference for this order. Echoed back.    |

```json
{
  "amount": 1000,
  "sourceCurrency": "EUR",
  "targetCurrency": "USD",
  "externalReference": "your-ref-001"
}
```

**Response `202`**

```json
{ "providerRef": "prv_00000001" }
```

Response times vary. Under load the service may occasionally answer with a `5xx`
status; a client-visible failure on submission is not a definitive statement
about whether the order was received.

**Response `400`** — the request body did not validate.

### `GET /v1/conversions/:providerRef`

Returns the order as we currently see it.

**Response `200`**

```json
{
  "providerRef": "prv_00000001",
  "externalReference": "your-ref-001",
  "sourceCurrency": "EUR",
  "targetCurrency": "USD",
  "sourceAmount": 1000,
  "status": "executed",
  "rate": 1.081234,
  "targetAmount": 1081.23,
  "reasonCode": null,
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:02.000Z"
}
```

`status` is one of `accepted`, `executed`, `rejected`. `rate` and `targetAmount`
are populated once an order is executed; `reasonCode` is populated when an order
is rejected.

**Response `404`** — unknown reference.

---

## Webhooks

Order outcomes are delivered by `POST` to the URL you configure. We send
events as we process an order; deliveries are made on a best-effort basis and a
given event may reach your endpoint more than once, so treat the `eventId` as
the stable identity of an event. Respond `2xx` to acknowledge receipt.

**Envelope**

| Field        | Type   | Description                                       |
| ------------ | ------ | ------------------------------------------------- |
| `eventId`    | string | Identifier of the event.                          |
| `eventType`  | string | See event types below.                            |
| `providerRef`| string | The order this event refers to.                   |
| `occurredAt` | string | ISO-8601 timestamp of the event.                  |
| `data`       | object | Event-specific payload.                           |

### Event types

#### `conversion.accepted`

The order has been accepted for processing.

```json
{
  "eventId": "evt_prv_00000001_accepted",
  "eventType": "conversion.accepted",
  "providerRef": "prv_00000001",
  "occurredAt": "2026-01-01T12:00:01.000Z",
  "data": {
    "providerRef": "prv_00000001",
    "externalReference": "your-ref-001",
    "status": "accepted",
    "sourceCurrency": "EUR",
    "targetCurrency": "USD",
    "sourceAmount": 1000
  }
}
```

#### `conversion.executed`

The order has been executed at the applied rate.

```json
{
  "eventId": "evt_prv_00000001_executed",
  "eventType": "conversion.executed",
  "providerRef": "prv_00000001",
  "occurredAt": "2026-01-01T12:00:02.000Z",
  "data": {
    "providerRef": "prv_00000001",
    "externalReference": "your-ref-001",
    "status": "executed",
    "sourceCurrency": "EUR",
    "targetCurrency": "USD",
    "sourceAmount": 1000,
    "rate": 1.081234,
    "targetAmount": 1081.23
  }
}
```

#### `conversion.rejected`

The order was not executed.

```json
{
  "eventId": "evt_prv_00000001_rejected",
  "eventType": "conversion.rejected",
  "providerRef": "prv_00000001",
  "occurredAt": "2026-01-01T12:00:02.000Z",
  "data": {
    "providerRef": "prv_00000001",
    "externalReference": "your-ref-001",
    "status": "rejected",
    "reasonCode": "COMPLIANCE_HOLD"
  }
}
```

Reason codes: `INSUFFICIENT_FUNDS`, `COMPLIANCE_HOLD`, `RATE_EXPIRED`,
`LIMIT_EXCEEDED`, `COUNTERPARTY_UNAVAILABLE`.

---

## Sandbox behaviour

This sandbox reproduces the conditions of the live service in a deterministic
way. All variability is driven by a fixed seed (`PROVIDER_SEED`), so the same
sequence of calls always produces the same results.

To write tests against a specific situation, set the `X-Test-Scenario` request
header on `POST /v1/conversions`. When the header is absent, behaviour follows
the seed.

| `X-Test-Scenario`    | Effect                                                        |
| -------------------- | ------------------------------------------------------------- |
| `happy_path`         | Fast acceptance then execution, no anomalies.                 |
| `reject`             | The order is rejected with a reason code.                     |
| `error_after_accept` | The submission is answered with `502` after being received.   |
| `early_webhook`      | A webhook is delivered before the submission response.        |
| `out_of_order`       | The execution event is delivered before the acceptance event. |
| `duplicate_webhook`  | The terminal event is delivered twice.                        |
