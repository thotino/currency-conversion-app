export class IdempotencyKeyViolationError extends Error {
    code: string = "DUPLICATED_IDEMPOTENCY_KEY"; 
    value: {key: string};
    constructor(key: string) {
        const message = "Conversion for this key already exists"
        super(message)
        this.value = {key}
    }
}