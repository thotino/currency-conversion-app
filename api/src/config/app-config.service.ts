import { Injectable } from "@nestjs/common";
import { AppConfig, loadConfig } from "./configuration";

@Injectable()
export class AppConfigService implements AppConfig {
    private readonly config: AppConfig = loadConfig();

    get port(): number {
        return this.config.port;
    }

    get databaseUrl(): string {
        return this.config.databaseUrl;
    }

    get providerBaseUrl(): string {
        return this.config.providerBaseUrl;
    }
}
