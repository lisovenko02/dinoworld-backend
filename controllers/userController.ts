import { Request, Response } from 'express'
import catchAsync from '../helpers/catchAsync'
import { User, UserModel } from '../models/userModel'
import HttpError from '../helpers/HttpError'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

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
    password: bcrypt.hashSync(password, 10),
    inventoryId: '',
    trades: [],
  } as User)

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

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await UserModel.find()
  res.json(users)
})
