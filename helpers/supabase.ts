import dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import { v4 as uuid } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export const uploadToStorage = async ({
  file,
  userId,
}: {
  file: { buffer: Buffer; mimetype: string }
  userId: string
}) => {
  const filePath = `dinoworld/${userId}/${uuid()}`

  const { error } = await supabase.storage
    .from('event-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    })

  if (error) return { error }

  const { data } = supabase.storage.from('event-images').getPublicUrl(filePath)
  console.log('data', data)
  return { url: data.publicUrl }
}
