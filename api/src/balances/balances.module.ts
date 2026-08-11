import { Module } from "@nestjs/common";
import { BalancesService } from "./balances.service";
import { ConversionsModule } from "src/conversions/conversions.module";
import { BalancesController } from "./balances.controller";

@Module({
    imports: [ConversionsModule],
    controllers: [BalancesController],
    providers: [BalancesService],
    exports: [BalancesService],
})
export class BalancesModule {}
