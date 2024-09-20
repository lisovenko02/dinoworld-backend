import express from 'express'
import {
  addToInventory,
  getUserInventory,
} from '../controllers/inventoryController'
import authenticate from '../helpers/authenticate'

const inventoryRouter = express.Router()

inventoryRouter.post('/', authenticate, addToInventory)

inventoryRouter.get('/:id', getUserInventory)

export default inventoryRouter
