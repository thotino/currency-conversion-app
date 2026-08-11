import { Injectable } from "@nestjs/common";
import { ConversionsService } from "./conversions.service";

@Injectable()
export class ConversionsWorker {
    timer: NodeJS.Timeout | null = null;
    constructor(private readonly conversionsService: ConversionsService) {}
    async run() {
        this.timer = setInterval(async () => {
            for await (const conversion of this.conversionsService.findCreated()) {
                await this.conversionsService.createConversionToProvider(
                    conversion!.id,
                    conversion!.quote,
                );
            }
            // Find created conversions
            // Submit to provider
            // if ok, mark as submitted
            // if not, mark as failed
        }, 1000 * 60);
    }
    async stop() {
        if (this.timer != null) {
            clearInterval(this.timer);
        }
    }
}
