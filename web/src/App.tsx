import { useEffect, useState } from "react";
import { getHealth, postQuotes, postConversions, getConversions, getBalances } from "./api";

export function App(): JSX.Element {
  const [health, setHealth] = useState<string>("loading…");
  const [balances, setBalances] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceCurrency, setSourceCurrency] = useState("EUR");
  const [targetCurrency, setTargetCurrency] = useState("USD");

  const [quote, setQuote] = useState(null);
  const [conversions, setConversions] = useState([]);

  async function computeQuotes() {
    const quote = await postQuotes(
      parseFloat(amount),
      sourceCurrency,
      targetCurrency,
    );
    setQuote(quote);
  }

  async function convert(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await postConversions(quote.id);
  }

  useEffect(() => {
    getHealth()
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((error: unknown) => setHealth(`error: ${String(error)}`));
  }, []);

  useEffect(() => {
    getConversions().then((conversions) => { 
      setConversions(conversions); 
    })
  }, []);

  useEffect(() => {
    getBalances().then((balancesSummary) => {
      setBalances(JSON.stringify(balancesSummary.balance))
    });
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Fintech - Currency Conversion App</h1>
      <p>
        API health: <code>{health}</code>
      </p>

      <div>
        <h2>Balances</h2>
        <p>Current user balances: <code>{balances}</code></p>
      </div>

      <div>
        <h2>Quotes and conversions</h2>
        <form onSubmit={convert}>
          <div>
            <label for="amount">Amount :</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
            ></input>
          </div>

          <br></br>

          <div>
            <label for="source_currency">Source currency :</label>
            <select
              id="source_currency"
              name="source_currency"
              value={sourceCurrency}
              onChange={(e) => setSourceCurrency(e.target.value)}
              required
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <br></br>

          <div>
            <label for="target_currency">Target currency :</label>
            <select
              id="target_currency"
              name="target_currency"
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              required
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <hr></hr>

          <h3>Quotes</h3>

          {quote && (
            <div>
              <p>
                Conversion rate : <span id="rate">{quote.rate}</span>
              </p>
              <p>
                Fees :{" "}
                <span id="fees">
                  {quote.fees.amount} {quote.fees.currency}
                </span>
              </p>
              <p>
                Converted amount :{" "}
                <span id="targetAmount">{quote.target.amount}</span>
              </p>
              <p>
                Expires at :{" "}
                <span id="quoteExpiration">{quote.expiration}</span>
              </p>
            </div>
          )}

          <br></br>

          <button type="button" id="btnComputeQuote" onClick={computeQuotes}>
            Ask for quotes
          </button>

          <button type="submit" id="btnConvert">
            Convert
          </button>
        </form>
      </div>
      <div>
        <table>
          <thead>
            <tr>
            <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {conversions.map((conversion) => (
              <tr key={conversion.id}>
                <td>
                  {conversion.id}
                </td>
                <td>
                  {conversion.quote.source.amount} {conversion.quote.source.currency}
                </td>
                <td>
                  {conversion.quote.target.amount} {conversion.quote.target.currency}
                </td>
                <td>{conversion.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
