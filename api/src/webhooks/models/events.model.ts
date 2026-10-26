import { CreationOptional, DataTypes } from "sequelize";
import {
    Column,
    CreatedAt,
    Model,
    Table,
    UpdatedAt,
} from "sequelize-typescript";
import { EventProcessingStatus } from "src/constants";

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
        type: DataTypes.ENUM,
        allowNull: false,
        values: Object.values(EventProcessingStatus),
    })
    declare event_processing_status: string;

    @Column({ type: DataTypes.DATE, allowNull: false })
    declare event_occurred_at: Date;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare event_payload: Record<string, unknown>;

    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;
}
