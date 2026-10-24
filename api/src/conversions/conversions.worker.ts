import { Injectable } from "@nestjs/common";
import { ConversionsService } from "./conversions.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ConversionsWorker {
    constructor(private readonly conversionsService: ConversionsService) {}
    @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
    async run() {
        for await (const conversion of this.conversionsService.findCreated()) {
            // TODO: Mark conversion as SUBMITTING
            // TODO: Submit to provider
            // TODO: Mark as SUBMITTED, UNKNOWN, REJECTED
            await this.conversionsService.createConversionToProvider(
                conversion!.id,
                conversion!.quote,
            );
        }
        // Find created conversions
        // Submit to provider
        // if ok, mark as submitted
        // if not, mark as failed
        // this.timer = setInterval(async () => {
        // }, 1000 * 60);
    }
    // async stop() {
    //     if (this.timer != null) {
    //         clearInterval(this.timer);
    //     }
    // }
}
