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
export enum WebhookEventProcessingStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    IGNORED = "IGNORED",
    FAILED_NEED_MANUAL_REVIEW = "FAILED_NEED_MANUAL_REVIEW"
}
export const USER_ID = "00000000-0000-0000-0000-000000000001";
export enum WebhookEventDataStatus {
    EXECUTED = "executed",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
}