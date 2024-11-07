import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { IUser, UserModel } from '../models/userModel'
import HttpError from '../helpers/HttpError'
import { AuthenticatedRequest } from '../helpers/authenticate'
import { InventoryModel } from '../models/inventoryModel'
import { TradeModel } from '../models/tradeModel'
import { ProductModel } from '../models/productModel'

export const requestTrade = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { _id: initiatorId } = req.user!
    const { id: receiverId } = req.params

    const { initiatorProducts, receiverProducts } = req.body

    if (!initiatorProducts.length && !receiverProducts.length) {
      throw HttpError(400, 'Trade must contain at least one item')
    }

    if (initiatorId?.toString() === receiverId) {
      throw HttpError(400, 'Receiver cannot be the same as the initiator')
    }

    const initiator = await UserModel.findById(initiatorId)
    const receiver = await UserModel.findById(receiverId)
    if (!initiator || !receiver) {
      throw HttpError(404, 'RECEIVER or initiator not found')
    }

    const initiatorInventory = await InventoryModel.findOne({
      userId: initiatorId,
    })
    const receiverInventory = await InventoryModel.findOne({
      userId: receiverId,
    })

    const initiatorHasAllProducts = initiatorProducts.every(
      (productId: string) =>
        initiatorInventory?.userProducts.includes(productId)
    )
    if (!initiatorHasAllProducts) {
      throw HttpError(400, 'Initiator does not own all trade products')
    }

    const receiverHasAllProducts = receiverProducts.every((productId: string) =>
      receiverInventory?.userProducts.includes(productId)
    )
    if (!receiverHasAllProducts) {
      throw HttpError(400, 'Receiver does not own all trade products')
    }

    const trade = await TradeModel.create({
      initiator: initiatorId,
      receiver: receiverId,
      initiatorProducts,
      receiverProducts,
      status: 'Pending',
      receiverConfirmed: false,
    })

    initiator.trades.push(trade._id)
    receiver.trades.push(trade._id)

    await initiator.save()
    await receiver.save()

    res.status(201).json(trade)
  }
)

export const confirmTrade = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { tradeId, status } = req.body
    const { _id: loggedUserId } = req.user!

    const trade = await TradeModel.findById(tradeId)
    if (!trade) {
      throw HttpError(404, 'Trade not found or ')
    }

    if (trade.receiverConfirmed === true || trade.status !== 'Pending') {
      throw HttpError(400, 'Trade is already closed')
    }

    if (loggedUserId?.toString() !== trade.receiver.toString()) {
      throw HttpError(400, 'You cannot confirm this trade')
    }

    const initiatorInventory = await InventoryModel.findOne({
      userId: trade.initiator,
    })
    const receiverInventory = await InventoryModel.findOne({
      userId: trade.receiver,
    })

    if (!initiatorInventory || !receiverInventory) {
      throw HttpError(404, 'Initiator or receiver inventory not found')
    }

    if (status === 'Completed') {
      trade.receiverConfirmed = true
      trade.status = 'Completed'

      const initiatorHasAllProducts = trade.initiatorProducts.every(
        (productId) => initiatorInventory?.userProducts.includes(productId)
      )
      if (!initiatorHasAllProducts) {
        throw HttpError(400, 'Initiator does not own all trade products')
      }

      const receiverHasAllProducts = trade.receiverProducts.every((productId) =>
        receiverInventory?.userProducts.includes(productId)
      )
      if (!receiverHasAllProducts) {
        throw HttpError(400, 'Receiver does not own all trade products')
      }

      trade.initiatorProducts.forEach((initiatorProductId) => {
        const initiatorIndex = initiatorInventory.userProducts.findIndex(
          (productId) => productId.toString() === initiatorProductId.toString()
        )

        if (initiatorIndex !== -1) {
          initiatorInventory.userProducts.splice(initiatorIndex, 1)
        }
      })

      trade.receiverProducts.forEach((receiverProductId) => {
        const receiverIndex = receiverInventory.userProducts.findIndex(
          (productId) => productId.toString() === receiverProductId.toString()
        )

        if (receiverIndex !== -1) {
          receiverInventory.userProducts.splice(receiverIndex, 1)
        }
      })

      initiatorInventory.userProducts.push(...trade.receiverProducts)
      receiverInventory.userProducts.push(...trade.initiatorProducts)

      await initiatorInventory.save()
      await receiverInventory.save()
    } else {
      trade.receiverConfirmed = true
      trade.status = 'Canceled'
    }

    await trade.save()

    res.json({ message: 'Trade was successfully closed' })
  }
)

export const getUserTrades = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { _id: userId } = req.user!
    if (!userId) throw HttpError(404, `You aren't authenticated`)

    const trades = await TradeModel.find({
      $or: [{ initiator: userId }, { receiver: userId }],
    })
      .populate('initiator', 'username imageUrl')
      .populate('receiver', 'username imageUrl')

    const productIds = Array.from(
      new Set(
        trades.flatMap((trade) => [
          ...trade.initiatorProducts,
          ...trade.receiverProducts,
        ])
      )
    )

    const products = await ProductModel.find({ _id: { $in: productIds } })

    const tradeProductInfo = trades.map((trade) => {
      const initiatorProductInfo = trade.initiatorProducts.map((id) =>
        products.find((product) => product._id.toString() === id.toString())
      )

      const receiverProductInfo = trade.receiverProducts.map((id) =>
        products.find((product) => product._id.toString() === id.toString())
      )

      return {
        _id: trade._id,
        initiatorProducts: initiatorProductInfo,
        receiverProducts: receiverProductInfo,
        status: trade.status,
        initiator: {
          _id: trade.initiator._id,
          username: (trade.initiator as IUser).username,
          imageUrl: (trade.initiator as IUser).imageUrl,
        },
        receiver: {
          _id: trade.receiver._id,
          username: (trade.receiver as IUser).username,
          imageUrl: (trade.receiver as IUser).imageUrl,
        },
        receiverConfirmed: trade.receiverConfirmed,
        isLoggedUserReceiver:
          trade.receiver._id.toString() === userId.toString(),
      }
    })

    res.status(200).json(tradeProductInfo.reverse())
  }
)

export const getTradesCountByStatus = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id

    const tradeCounts = await TradeModel.aggregate([
      {
        $match: {
          $or: [{ initiator: userId }, { receiver: userId }],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const totalTrades = await TradeModel.countDocuments({
      $or: [{ initiator: userId }, { receiver: userId }],
    })

    res.json({
      tradeCounts: tradeCounts.reverse(),
      totalTrades,
    })
  }
)
