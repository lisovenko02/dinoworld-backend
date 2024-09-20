import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose'
import { User } from './userModel'
import { Product } from './productModel'
import { Document, Types } from 'mongoose'

export interface IInventory extends Document {
  _id: Types.ObjectId
  userId: Ref<User>
  userProducts: Product[]
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Inventory {
  public _id?: Types.ObjectId

  @prop({ required: true, ref: () => 'User' })
  public userId!: Ref<User>

  @prop({ required: true, ref: () => Product, type: () => [Types.ObjectId] })
  public userProducts!: Ref<Product>[]
}

export const InventoryModel = getModelForClass(Inventory)
