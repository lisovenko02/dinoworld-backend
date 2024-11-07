import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose'
import { User } from './userModel'
import { Product } from './productModel'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Trade {
  public _id?: string

  @prop({ ref: () => 'User', required: true })
  public initiator!: Ref<User>

  @prop({ ref: () => 'User', required: true })
  public receiver!: Ref<User>

  @prop({ ref: () => 'Product', required: true })
  public initiatorProducts!: Ref<Product>[]

  @prop({ ref: () => 'Product', required: true })
  public receiverProducts!: Ref<Product>[]

  @prop({ default: 'Pending' })
  public status!: 'Pending' | 'Completed' | 'Canceled'

  @prop({ default: false })
  public receiverConfirmed?: boolean
}

export const TradeModel = getModelForClass(Trade)
