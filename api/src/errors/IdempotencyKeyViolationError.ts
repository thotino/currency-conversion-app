import { ServiceErrorInterface } from "src/errors";

export class IdempotencyKeyViolationError
    extends Error
    implements ServiceErrorInterface
{
    code: string = "DUPLICATED_IDEMPOTENCY_KEY";
    value: { key: string };
    constructor(key: string) {
        const message = "Conversion for this key already exists";
        super(message);
        this.value = { key };
    }
}
