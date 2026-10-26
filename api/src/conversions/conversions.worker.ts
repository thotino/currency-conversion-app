import { Injectable } from "@nestjs/common";
import { ConversionsService } from "./conversions.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ConversionsWorker {
    constructor(private readonly conversionsService: ConversionsService) {}
    @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
    async run() {
        const conversionsToSubmit = await this.conversionsService.findCreated();
        if (!Array.isArray(conversionsToSubmit)) {
            return;
        }
        const submissions = await Promise.all(
            conversionsToSubmit
                .filter(conversion => conversion != null)
                .map(conversion => {
                    return this.conversionsService.submitToProvider(
                        conversion.id,
                        conversion.quote,
                    );
                }),
        );
        await this.conversionsService.updateAfterSubmission(submissions);
    }
}
