import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import cors from 'cors'
import productRouter from './routes/productRouter'
import usersRouter from './routes/userRouter'
import inventoryRouter from './routes/inventoryRouter'
import tradeRouter from './routes/tradeRouter'

dotenv.config()

const app = express()

app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

app.use('/products', productRouter)
app.use('/user', usersRouter)
app.use('/inventory', inventoryRouter)
app.use('/trade', tradeRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const { status = 500, message = 'Server error' } = err
  res.status(status).json({ message })
})

export default app
