import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { AuthenticatedRequest } from '../helpers/authenticate'
import { InventoryModel } from '../models/inventoryModel'
import { ProductModel } from '../models/productModel'
import HttpError from '../helpers/HttpError'
import { UserModel } from '../models/userModel'

export const addToInventory = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.body
    const { money, _id: userId } = req.user!
    if (!productId) {
      throw HttpError(400, 'Product ID is required')
    }

    const product = await ProductModel.findById(productId)
    if (!product) {
      throw HttpError(404, 'Product not found')
    }

    if (money < product.price) {
      throw HttpError(400, 'Not enough money to purchase this product')
    }

    let inventory = await InventoryModel.findOne({ userId })
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
      {
        $set: { inventoryId: inventory._id.toString() },
        $inc: { money: -product.price },
      },
      { new: true }
    )

    res.status(200).json({ message: 'Product added to inventory', inventory })
  }
)

export const getUserInventory = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.params

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
      userInfo: {
        _id: user._id,
        username: user.username,
        imageUrl: user.imageUrl,
      },
      totalItems: inventoryItems.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(inventoryItems.length / limitNumber),
      items: paginatedItems,
    })
  }
)

export const getTradersInventories = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { _id: initiatorId } = req.user!
    const { id: receiverId } = req.params

    if (!receiverId || receiverId.length !== 24) {
      throw HttpError(400, 'Invalid receiver ID')
    }

    // Отримуємо інвентарі з даними про користувачів
    const inventories = await InventoryModel.find({
      $or: [{ userId: initiatorId }, { userId: receiverId }],
    }).populate('userId', 'username _id imageUrl') // Витягуємо username, _id і imageUrl

    if (inventories.length !== 2) {
      throw HttpError(404, 'One or both inventories not found')
    }

    const initiatorInventory = inventories.find(
      (inventory) => inventory.userId._id.toString() === initiatorId.toString()
    )
    const receiverInventory = inventories.find(
      (inventory) => inventory.userId._id.toString() === receiverId
    )

    if (!initiatorInventory || !receiverInventory) {
      throw HttpError(404, 'One or both inventories not found')
    }

    const initiatorProducts = await Promise.all(
      initiatorInventory.userProducts.map((productId) =>
        ProductModel.findById(productId)
      )
    )

    const receiverProducts = await Promise.all(
      receiverInventory.userProducts.map((productId) =>
        ProductModel.findById(productId)
      )
    )

    // Відправляємо дані про продукти і користувачів
    res.json({
      initiator: {
        products: initiatorProducts,
        user: initiatorInventory.userId, // Дані про ініціатора
      },
      receiver: {
        products: receiverProducts,
        user: receiverInventory.userId, // Дані про отримувача
      },
    })
  }
)
