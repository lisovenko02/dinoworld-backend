import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import { NextFunction, Request, Response } from 'express'
import { User, UserModel } from '../models/userModel'
import HttpError from './HttpError'

dotenv.config()

const { ACCESS_KEY } = process.env

export interface AuthenticatedRequest extends Request {
  user?: InstanceType<typeof User> | null
}

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { authorization = '' } = req.headers
  const [bearer, token] = authorization.split(' ')

  if (bearer !== 'Bearer') {
    next(HttpError(401))
  }

  try {
    const users = jwt.verify(token, ACCESS_KEY as string) as { id: string }
    const user = await UserModel.findById(users.id).exec()

    if (!user || !user.token) {
      next(HttpError(401))
    }

    req.user = user

    next()
  } catch {
    next(HttpError(401))
  }
}

export default authenticate
