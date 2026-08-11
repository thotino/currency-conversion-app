export interface AppConfig {
    port: number;
    databaseUrl: string;
    providerBaseUrl: string;
}

export function loadConfig(): AppConfig {
    const databaseUrl = process.env.DATABASE_URL;
    const providerBaseUrl = process.env.PROVIDER_BASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required");
    }
    if (!providerBaseUrl) {
        throw new Error("PROVIDER_BASE_URL is required");
    }

    return {
        port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000,
        databaseUrl,
        providerBaseUrl,
    };
}
