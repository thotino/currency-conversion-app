export enum Currency {
    EUR = "EUR",
    USD = "USD",
    GBP = "GBP",
}
export enum ConversionStatus {
    CREATED = "CREATED",
    SUBMITTING = "SUBMITTING",
    UNKNOWN = "UNKNOWN",
    SUBMITTED = "SUBMITTED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    FAILED_NEED_MANUAL_REVIEW = "FAILED_NEED_MANUAL_REVIEW",
}
export enum EventProcessingStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
}
export const USER_ID = "00000000-0000-0000-0000-000000000001";
