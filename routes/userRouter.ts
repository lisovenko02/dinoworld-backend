import express from 'express'
import { getUsers, signIn, signUp } from '../controllers/userController'
import authenticate from '../helpers/authenticate'

const userRouter = express.Router()

userRouter.post('/sign-up', signUp)

userRouter.post('/sign-in', signIn)

userRouter.get('/', getUsers)

export default userRouter
