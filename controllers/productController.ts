import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { ProductModel } from '../models/productModel'

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductModel.find()

  res.json(products)
})
