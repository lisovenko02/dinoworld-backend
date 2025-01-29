import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { ProductModel } from '../models/productModel'
import HttpError from '../helpers/HttpError'

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 12

  const totalProducts = await ProductModel.countDocuments()

  const products = await ProductModel.find()
    .limit(+limit)
    .skip(+limit * (+page - 1))
    .exec()

    if (!products.length) {
    throw HttpError(404, 'Products not found')
  }

  res.json({
    totalProducts,
    totalPages: Math.ceil(totalProducts / +limit),
    currentPage: page,
    products,
  })
})

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const { id: productId } = req.params
  const product = await ProductModel.findById(productId)

  if (!product) {
    throw HttpError(404, 'Product not found')
  }

  res.json(product)
})
