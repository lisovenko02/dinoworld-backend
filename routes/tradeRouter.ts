import express from 'express'
import {
  confirmTrade,
  getTradesCountByStatus,
  getUserTrades,
  requestTrade,
} from '../controllers/tradeController'
import authenticate from '../helpers/authenticate'

const tradeRouter = express.Router()

tradeRouter.post('/request/:id', authenticate, requestTrade)

tradeRouter.post('/', authenticate, confirmTrade)

tradeRouter.get('/', authenticate, getUserTrades)

tradeRouter.get('/countByStatus', authenticate, getTradesCountByStatus)

export default tradeRouter
