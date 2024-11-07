import mongoose from 'mongoose'
import app from './app'

const { DB_HOST } = process.env

if (!DB_HOST) {
  console.error('DB_HOST is not defined')
  process.exit(1)
}

mongoose.set('strictQuery', true)

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(process.env.PORT || 4000)
    console.log('Database connection successful')
  })
  .catch((error) =>
    console.error('Error connecting to MongoDB:', error.message)
  )
