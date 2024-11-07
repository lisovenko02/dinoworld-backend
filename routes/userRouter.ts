import express from 'express'
import {
  depositToAccount,
  editUser,
  getCurrentUser,
  getUserProfileById,
  getUsers,
  logout,
  signIn,
  signUp,
} from '../controllers/userController'
import authenticate from '../helpers/authenticate'
import { upload } from '../helpers/upload'

const userRouter = express.Router()

userRouter.post('/sign-up', signUp)

userRouter.post('/sign-in', signIn)

userRouter.get('/', getUsers)

userRouter.get('/profile/:id', getUserProfileById)

userRouter.post('/update', authenticate, upload.single('img'), editUser)

userRouter.get('/isLoggedIn', authenticate, getCurrentUser)

userRouter.post('/deposit', authenticate, depositToAccount)

userRouter.post('/logout', authenticate, logout)

export default userRouter
