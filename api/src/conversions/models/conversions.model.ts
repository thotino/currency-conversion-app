import { DataTypes, CreationOptional } from "sequelize";
import {
    Table,
    Model,
    Column,
    CreatedAt,
    UpdatedAt,
    HasOne,
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";
import { Quote } from "src/quotes/models/quotes.model";

@Table({
    timestamps: true,
    modelName: "Conversion",
    tableName: "conversions",
})
export class Conversion extends Model {
    @Column({ type: DataTypes.STRING, primaryKey: true, allowNull: false })
    declare id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare user_id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare provider_ref: string;

    @Column({ type: DataTypes.STRING, allowNull: false, unique: true })
    @ForeignKey(() => Quote)
    declare quote_id: string;

    @Column({ type: DataTypes.STRING, allowNull: false })
    declare status: string;

    @CreatedAt
    declare created_at: CreationOptional<Date>;

    @UpdatedAt
    declare updated_at: CreationOptional<Date>;

    @BelongsTo(() => Quote, {
        targetKey: "id",
        foreignKey: "quote_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    declare quote: Quote;
}
