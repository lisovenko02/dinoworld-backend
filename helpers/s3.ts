import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'
import dotenv from 'dotenv'

const s3 = new S3Client()

dotenv.config()

const BUCKET = process.env.BUCKET

interface File {
  buffer: Buffer
  mimetype: string
  originalname?: string
}

export const uploadToS3 = async ({
  file,
  userId,
}: {
  file: File
  userId: string
}) => {
  const key = `${userId}/${uuid()}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  })
  try {
    await s3.send(command)

    return { key }
  } catch (error) {
    return { error }
  }
}
