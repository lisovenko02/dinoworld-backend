// import { Request, Response } from 'express'
// import catchAsync from '../helpers/catchAsync'
// import { AuthenticatedRequest } from '../helpers/authenticate'
// import { Inventory, InventoryModel } from '../models/inventoryModel'
// import { ProductModel } from '../models/productModel'
// import HttpError from '../helpers/HttpError'
// import { UserModel } from '../models/userModel'

// export const addToInventory = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { productId } = req.body

//     if (!productId) {
//       throw HttpError(400, 'Product ID is required')
//     }

//     const product = await ProductModel.findById(productId)
//     if (!product) {
//       throw HttpError(404, 'Product not found')
//     }

//     let inventory = await InventoryModel.findOne({ userId: req.user?._id })
//     if (!inventory) {
//       inventory = await InventoryModel.create({
//         userId: req.user?._id,
//         userProducts: [product._id],
//       })
//     } else {
//       inventory.userProducts.push(product._id)
//       await inventory.save()
//     }

//     await UserModel.findByIdAndUpdate(
//       req.user?._id,
//       { $set: { inventoryId: inventory._id.toString() } },
//       { new: true }
//     )

//     res.status(200).json({ message: 'Product added to inventory', inventory })
//   }
// )

// export const getUserInventory = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id: userId } = req.params

//     const { page = 1 } = req.query
//     const pageNumber = parseInt(page as string, 10)
//     const limitNumber = 25

//     if (userId.length !== 24) {
//       throw HttpError(404, 'User not found')
//     }

//     const user = await UserModel.findById(userId)
//     if (!user) {
//       throw HttpError(404, 'User not found')
//     }

//     const inventory = await InventoryModel.findById(user.inventoryId)
//     if (!inventory) {
//       throw HttpError(404, 'Inventory not found')
//     }
//     const inventoryItems = await Promise.all(
//       inventory?.userProducts.map((product) => {
//         return ProductModel.findById(product)
//       })
//     )

//     const startIndex = (pageNumber - 1) * limitNumber
//     const endIndex = pageNumber * limitNumber
//     const paginatedItems = inventoryItems.slice(startIndex, endIndex)

//     res.json({
//       totalItems: inventoryItems.length,
//       currentPage: pageNumber,
//       totalPages: Math.ceil(inventoryItems.length / limitNumber),
//       items: paginatedItems,
//     })
//   }
// )

// export const getTradersInventories = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { _id: initiatorId } = req.user!
//     const { id: receiverId } = req.params

//     const { page = 1, limit = 20 } = req.query
//     const pageNumber = parseInt(page as string, 10)
//     const limitNumber = parseInt(limit as string, 10)

//     if (!receiverId || receiverId.length !== 24) {
//       throw HttpError(400, 'Invalid receiver ID')
//     }

//     const inventories = await InventoryModel.find({
//       $or: [{ userId: initiatorId }, { userId: receiverId }],
//     })

//     if (inventories.length !== 2) {
//       throw HttpError(404, 'One or both inventories not found')
//     }

//     const initiatorInventory = inventories.find(
//       (inventory) => inventory.userId.toString() === initiatorId?.toString()
//     )
//     const receiverInventory = inventories.find(
//       (inventory) => inventory.userId.toString() === receiverId
//     )

//     if (!initiatorInventory || !receiverInventory) {
//       throw HttpError(404, 'One or both inventories not found')
//     }

//     const [initiatorProducts, receiverProducts] = await Promise.all([
//       Promise.all(
//         initiatorInventory.userProducts.map((productId) =>
//           ProductModel.findById(productId)
//         )
//       ),
//       Promise.all(
//         receiverInventory.userProducts.map((productId) =>
//           ProductModel.findById(productId)
//         )
//       ),
//     ])

//     const paginate = (
//       products: any[],
//       pageNumber: number,
//       limitNumber: number
//     ) => {
//       const startIndex = (pageNumber - 1) * limitNumber
//       const endIndex = pageNumber * limitNumber
//       const paginatedItems = products.slice(startIndex, endIndex)
//       return {
//         totalItems: products.length,
//         currentPage: pageNumber,
//         totalPages: Math.ceil(products.length / limitNumber),
//         items: paginatedItems,
//       }
//     }

//     res.json({
//       initiatorProducts: paginate(initiatorProducts, pageNumber, limitNumber),
//       receiverProducts: paginate(receiverProducts, pageNumber, limitNumber),
//     })
//   }
// )
