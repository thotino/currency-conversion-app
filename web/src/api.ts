const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function getHealth(): Promise<unknown> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
