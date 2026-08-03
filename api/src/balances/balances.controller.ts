import { Controller, Get, NotImplementedException } from '@nestjs/common';

@Controller('balances')
export class BalancesController {
  @Get()
  list(): never {
    // TODO: expose client balances.
    throw new NotImplementedException();
  }
}
