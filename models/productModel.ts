import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Product {
  public _id?: string

  @prop({ required: true })
  public dinoName!: string

  @prop({ required: true })
  public image!: string

  @prop({ required: true })
  public rarity!: 'Common' | 'Rare' | 'Super Rare' | 'Legendary'

  @prop({ required: true })
  public type!: 'Dinosaurs' | 'Flying reptiles' | 'Marine reptiles'

  @prop({ required: true, default: 0 })
  public price!: number

  @prop({ required: true })
  public description!: string

  @prop({ required: true })
  public era!:
    | 'Holocene'
    | 'Late Cretaceous'
    | 'Early Cretaceous'
    | 'Late Triassic'
    | 'Early Jurassic'

  @prop({ required: true })
  public family!: string

  @prop({ required: true })
  public diet!: 'Carnivore' | 'Herbivore' | 'Piscivore'

  @prop({ required: true, default: 0 })
  public attack!: number

  @prop({ required: true, default: 0 })
  public defense!: number

  @prop({ required: true, default: 0 })
  public appeal!: number

  @prop({ required: true, type: () => [String] })
  public likes!: string[]

  @prop({ required: true, type: () => [String] })
  public dislikes!: string[]
}

export const ProductModel = getModelForClass(Product)
