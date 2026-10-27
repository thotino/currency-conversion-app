import { CreationOptional, DataTypes } from "sequelize";
import {
    Column,
    CreatedAt,
    Model,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { WebhookEventProcessingStatus } from "src/constants";
import { WebhookEventPayload } from "src/types";

@Table({
    timestamps: true,
    modelName: "Event",
    tableName: "events",
})
export class Event extends Model {
    @Column({ type: DataTypes.UUID, primaryKey: true })
    declare id: string;

    @Column({ type: DataTypes.STRING, unique: true, allowNull: false })
    declare event_id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare event_type: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare provider_ref: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        values: Object.values(WebhookEventProcessingStatus),
    })
    declare event_processing_status: WebhookEventProcessingStatus;

    @Column({ type: DataTypes.DATE, allowNull: false })
    declare event_occurred_at: Date;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare event_payload: WebhookEventPayload;

    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;
}
