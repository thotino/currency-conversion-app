import { useEffect, useState } from 'react';
import { getHealth } from './api';

export function App(): JSX.Element {
  const [health, setHealth] = useState<string>('loading…');

  useEffect(() => {
    getHealth()
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((error: unknown) => setHealth(`error: ${String(error)}`));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Keewe — Currency Conversion</h1>
      <p>
        API health: <code>{health}</code>
      </p>
    </main>
  );
}
