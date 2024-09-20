import { IUser } from '../models/userModel'
import jwt from 'jsonwebtoken'

export const generateToken = (user: IUser) => {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    process.env.JWT_SECRET || 'sadj2131jknjzkxc',
    {
      expiresIn: '30d',
    }
  )
}
