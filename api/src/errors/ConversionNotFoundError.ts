export class ConversionNotFoundError extends Error {
    code: string = "CONVERSION_NOT_FOUND";
    value: { providerRef: string; externalRef: string };
    constructor(providerRef: string, externalRef: string) {
        const message = "Conversion instance not found";
        super(message);
        this.value = { providerRef, externalRef };
    }
}
