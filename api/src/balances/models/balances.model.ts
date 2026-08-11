import { CreationOptional, DataTypes } from "sequelize";
import {
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
  Column,
  DataType,
} from "sequelize-typescript";

@Table({
  timestamps: true,
  modelName: "Balance",
  tableName: "balances",
})
export class Balance extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  declare user_id: string;
  
  @Column({ type: DataTypes.JSON, allowNull: false })
  declare balance_by_currency: Record<string, unknown>;

  @CreatedAt
  declare created_at: CreationOptional<Date>;

  @UpdatedAt
  declare updated_at: CreationOptional<Date>;
}
