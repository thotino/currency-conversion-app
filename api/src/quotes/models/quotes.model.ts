import { DataTypes, CreationOptional } from "sequelize";
import {
    Table,
    Column,
    Model,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
    HasOne,
} from "sequelize-typescript";
import { Conversion } from "src/conversions/models/conversions.model";
import { MoneyInterface } from "src/types";

@Table({
    timestamps: true,
    modelName: "Quote",
    tableName: "quotes",
})
export class Quote extends Model {
    @Column({ primaryKey: true, type: DataTypes.STRING })
    declare id: string;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare source: MoneyInterface;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare target: MoneyInterface;

    @Column({ type: DataTypes.JSON, allowNull: false })
    declare fees: MoneyInterface;

    @Column({ type: DataTypes.NUMBER, allowNull: false })
    declare rate: number;

    @Column({ type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false })
    declare consumed: boolean;

    @Column({ allowNull: false })
    declare expires_at: Date;

    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;

    @HasOne(() => Conversion, {
        sourceKey: "id",
        foreignKey: "quote_id",
    })
    declare conversion: Conversion | null;
}
