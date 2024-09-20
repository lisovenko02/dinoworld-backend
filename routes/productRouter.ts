import express from 'express'
import { getProducts } from '../controllers/productController'

const productRouter = express.Router()

productRouter.get('/', getProducts)

export default productRouter
