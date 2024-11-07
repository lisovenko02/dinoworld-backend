import express from 'express'
import { getProduct, getProducts } from '../controllers/productController'

const productRouter = express.Router()

productRouter.get('/', getProducts)

productRouter.get('/:id', getProduct)

export default productRouter
