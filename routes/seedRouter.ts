import express, { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { ProductModel } from '../models/productModel'
import { sampleProducts } from '../data'

const seedRouter = express.Router()

// seedRouter.get(
//   '/',
//   catchAsync(async (req: Request, res: Response) => {
//     // await ProductModel.deleteMany({})
//     // const createdProducts = await ProductModel.insertMany(sampleProducts)
//     res.json({ 'hello' })
//   })
// )

export default seedRouter
