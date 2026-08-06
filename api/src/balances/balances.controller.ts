import { Controller, Get, NotImplementedException, Query } from '@nestjs/common';
import { BalancesService } from './balances.service';

@Controller('balances')
export class BalancesController {
  constructor(readonly balancesService: BalancesService) {}
  @Get()
  async list(@Query("userId") userId: string) {
    const balance = await this.balancesService.buildBalanceOnDemand(userId)
    return balance
  }
}
