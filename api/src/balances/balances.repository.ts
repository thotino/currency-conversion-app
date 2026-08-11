import { Injectable } from "@nestjs/common";
import Balance from "src/entities/Balance";

@Injectable()
export class BalancesRepository {
    constructor() {}
    async findOne(userId: string) {}
    async update(balance: Balance) {}
}
