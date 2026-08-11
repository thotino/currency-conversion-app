import { CreationOptional, DataTypes } from "sequelize";
import {
    Column,
    CreatedAt,
    Model,
    Table,
    UpdatedAt,
} from "sequelize-typescript";

@Table({
    timestamps: true,
    modelName: "Event",
    tableName: "events",
})
export class Event extends Model {
    @Column({ type: DataTypes.STRING, primaryKey: true, unique: true })
    declare id: string;

    @Column({ type: DataTypes.STRING, primaryKey: true })
    declare provider_ref: string;

    @Column({ type: DataTypes.STRING, primaryKey: true })
    declare external_ref: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare status: string;

    @Column({ type: DataTypes.STRING, allowNull: true })
    declare occured_at: Date;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare payload: Record<string, unknown>;

    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;
}
