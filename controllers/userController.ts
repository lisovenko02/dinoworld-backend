import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { User, UserModel } from '../models/userModel'
import HttpError from '../helpers/HttpError'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { AuthenticatedRequest } from '../helpers/authenticate'
import { HydratedDocument } from 'mongoose'
import { InventoryModel } from '../models/inventoryModel'
import { ProductModel } from '../models/productModel'
import { uploadToS3 } from '../helpers/s3'

dotenv.config()

const { ACCESS_KEY } = process.env

export const signUp = catchAsync(async (req: Request, res: Response) => {
  const { email, username, firstName, lastName, password } = req.body

  const existingUser = await UserModel.findOne({ email })
  if (existingUser) {
    throw HttpError(409, 'Email is already in use')
  }

  const user = await UserModel.create({
    email,
    username,
    firstName,
    lastName,
    imageUrl: '',
    password: bcrypt.hashSync(password, 10),
    money: 0,
    trades: [],
  } as User)

  const inventory = await InventoryModel.create({
    userId: user._id,
    userProducts: [],
  })
  user.inventoryId = inventory._id.toString()
  await user.save()

  const payload = { id: user._id }
  const token = jwt.sign(payload, ACCESS_KEY as string, { expiresIn: '30d' })

  await UserModel.findByIdAndUpdate(user._id, { token })

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token,
  })
})

export const signIn = catchAsync(async (req: Request, res: Response) => {
  const { email, username, password } = req.body
  console.log('email', email)
  console.log('username', username)
  console.log('password', password)
  const user = await UserModel.findOne({
    $or: [{ email }, { username }],
  })
  if (!user) {
    throw HttpError(401, 'Email, username or password is wrong')
  }

  const comparePassword = await bcrypt.compare(password, user.password)
  if (!comparePassword) {
    throw HttpError(401, 'Email, username or password is wrong')
  }

  const payload = { id: user._id }
  const token = jwt.sign(payload, ACCESS_KEY as string, { expiresIn: '30d' })

  await UserModel.findByIdAndUpdate(user._id, { token })
  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    token,
  })
})

export const getCurrentUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as HydratedDocument<User>

    if (!user) {
      throw HttpError(404, 'User not found')
    }

    const userWithoutPassword = user.toObject() as Partial<User>

    delete userWithoutPassword.password

    res.json(userWithoutPassword)
  }
)

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query

  const searchQuery = {
    $or: [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  }

  const totalUsersByQuery = await UserModel.countDocuments(searchQuery)

  const users = await UserModel.find(searchQuery)
    .limit(Number(limit))
    .skip(Number(limit) * (Number(page) - 1))
    .exec()

  res.json({
    totalUsersByQuery,
    totalPages: Math.ceil(totalUsersByQuery / Number(limit)),
    currentPage: Number(page),
    users,
  })
})

export const depositToAccount = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user
    const { deposit } = req.body

    if (deposit === undefined) {
      throw HttpError(400, 'Deposit is required')
    }

    if (typeof deposit !== 'number' || deposit <= 0) {
      throw HttpError(400, 'Deposit must be a positive number')
    }

    if (!user) {
      throw HttpError(404, 'User not found')
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $inc: { money: deposit } },
      { new: true }
    )
    if (!updatedUser) {
      throw HttpError(404, 'User not found')
    }

    res.json({
      message: `You successfully deposit to your account, now your balance:${updatedUser.money?.toLocaleString()}$`,
    })
  }
)

export const getUserProfileById = catchAsync(
  async (req: Request, res: Response) => {
    const { id: userId } = req.params
    if (userId.length !== 24) {
      throw HttpError(404, 'User not found')
    }

    const user = await UserModel.findById(userId)
    if (!user) {
      throw HttpError(404, 'User not found')
    }
    const inventory = await InventoryModel.findById(user?.inventoryId)
    if (!inventory) {
      throw HttpError(404, 'Inventory not found')
    }

    const inventoryItems = await Promise.all(
      inventory?.userProducts.map((product) => {
        return ProductModel.findById(product)
      })
    )
    res.json({
      _id: user?._id,
      username: user?.username,
      firstName: user?.firstName,
      lastName: user?.lastName,
      imageUrl: user?.imageUrl,
      email: user?.email,
      trades: user?.trades,
      inventory: inventoryItems,
    })
  }
)

export const editUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { _id: userId } = req.user!
    const { firstName, lastName, email, password } = req.body

    const user = await UserModel.findOne({ _id: userId })

    let imgKey

    if (req.file) {
      const { file } = req

      const { error, key } = await uploadToS3({
        file,
        userId: userId!.toString(),
      })

      if (error) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as Error).message
            : String(error)
        throw HttpError(500, message)
      }

      imgKey = key
    }

    if (!user) {
      throw HttpError(404, 'User not found')
    }

    let hashPassword
    if (password && password !== null) {
      hashPassword = await bcrypt.hash(password, 10)
    }

    if (email !== user.email) {
      const existingEmail = await UserModel.findOne({ email })
      if (existingEmail) {
        throw HttpError(409, 'Email is already in use')
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        email,
        firstName,
        lastName,
        password: hashPassword,
        imageUrl:
          imgKey &&
          `https://${process.env.BUCKET}.s3.eu-north-1.amazonaws.com/${imgKey}`,
      },
      { new: true }
    )

    if (!updatedUser) {
      throw HttpError(404, 'User not found')
    }

    res.json(updatedUser)
  }
)

export const logout = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { _id } = req.user!

    await UserModel.findByIdAndUpdate(_id, { token: '' }, { new: true })

    res.status(204).json()
  }
)
