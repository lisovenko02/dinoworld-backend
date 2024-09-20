import { NextFunction, Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { AuthenticatedRequest } from '../helpers/authenticate'
import { InventoryModel } from '../models/inventoryModel'
import { ProductModel } from '../models/productModel'
import HttpError from '../helpers/HttpError'
import { UserModel } from '../models/userModel'

export const addToInventory = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.body

    if (!productId) {
      throw HttpError(400, 'Product ID is required')
    }

    const product = await ProductModel.findById(productId)
    if (!product) {
      throw HttpError(404, 'Product not found')
    }

    let inventory = await InventoryModel.findOne({ userId: req.user?._id })
    if (!inventory) {
      inventory = await InventoryModel.create({
        userId: req.user?._id,
        userProducts: [product._id],
      })
    } else {
      inventory.userProducts.push(product._id)
      await inventory.save()
    }

    await UserModel.findByIdAndUpdate(
      req.user?._id,
      { $set: { inventoryId: inventory._id.toString() } },
      { new: true }
    )

    res.status(200).json({ message: 'Product added to inventory', inventory })
  }
)

export const getUserInventory = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.params
    console.log(req.query)
    const { page = 1 } = req.query
    const pageNumber = parseInt(page as string, 10)
    const limitNumber = 25

    if (userId.length !== 24) {
      throw HttpError(404, 'User not found')
    }

    const user = await UserModel.findById(userId)
    if (!user) {
      throw HttpError(404, 'User not found')
    }

    const inventory = await InventoryModel.findById(user.inventoryId)
    if (!inventory) {
      throw HttpError(404, 'Inventory not found')
    }
    const inventoryItems = await Promise.all(
      inventory?.userProducts.map((product) => {
        return ProductModel.findById(product)
      })
    )

    const startIndex = (pageNumber - 1) * limitNumber
    const endIndex = pageNumber * limitNumber
    const paginatedItems = inventoryItems.slice(startIndex, endIndex)

    res.json({
      totalItems: inventoryItems.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(inventoryItems.length / limitNumber),
      items: paginatedItems,
    })
  }
)
