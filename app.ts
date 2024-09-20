import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import productRouter from './routes/productRouter'
import seedRouter from './routes/seedRouter'
import usersRouter from './routes/userRouter'
import inventoryRouter from './routes/inventoryRouter'

dotenv.config()

const app = express()

app.use(morgan('tiny'))
app.use(cors())
app.use(express.json())

app.use('/products', productRouter)
app.use('/seed', seedRouter)
app.use('/user', usersRouter)
app.use('/inventory', inventoryRouter)

export default app
