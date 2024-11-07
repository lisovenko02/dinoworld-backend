import express from 'express'
import {
  addToInventory,
  getTradersInventories,
  getUserInventory,
} from '../controllers/inventoryController'
import authenticate from '../helpers/authenticate'

const inventoryRouter = express.Router()

inventoryRouter.post('/', authenticate, addToInventory)

inventoryRouter.get('/:id', getUserInventory)

inventoryRouter.get('/traders/:id', authenticate, getTradersInventories)

export default inventoryRouter
