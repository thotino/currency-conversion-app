import { DataTypes, CreationOptional } from "sequelize";
import { Table, Model, Column, CreatedAt, UpdatedAt } from "sequelize-typescript";

@Table({
    timestamps: true,
    modelName: "Conversion",
    tableName: "conversions"
})
export class Conversion extends Model {
    @Column({ type: DataTypes.STRING, primaryKey: true, allowNull: false })
    declare id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare user_id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare provider_ref: string

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare quote: Record<string, unknown>;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare status: string;
    
    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;

}