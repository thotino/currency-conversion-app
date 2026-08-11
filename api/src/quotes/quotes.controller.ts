import { Controller, Post, Body } from "@nestjs/common";
import { CreateQuoteDto } from "./dtos/create-quote.dto";
import { QuotesService } from "./quotes.service";

@Controller("quotes")
export class QuotesController {
    constructor(readonly quotesService: QuotesService) {}
    @Post()
    async create(@Body() createQuote: CreateQuoteDto) {
        const quote = await this.quotesService.create(
            createQuote.amount,
            createQuote.sourceCurrency,
            createQuote.targetCurrency,
        );
        return quote;
    }
}
