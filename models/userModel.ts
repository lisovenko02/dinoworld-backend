import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose'
import { Trade } from './tradeModel'
import { Document, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
  imageUrl?: string
  inventoryId?: string
  trades?: Ref<Trade>[]
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class User {
  public _id?: Types.ObjectId

  @prop({ required: true, unique: true })
  public email!: string

  @prop({ required: true, unique: true })
  public username!: string

  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop()
  public imageUrl!: string

  @prop({ required: true })
  public password!: string

  @prop()
  public token?: string

  @prop({ default: '' })
  public inventoryId?: string

  @prop({ type: () => [String], default: [] })
  public trades!: Ref<Trade>[]

  @prop({ default: 0 })
  public money!: number
}

export const UserModel = getModelForClass(User)
