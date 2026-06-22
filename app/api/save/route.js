import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(request) {
  try {
    const { data, images } = await request.json()
    
    // Пытаемся сохранить на Рабочий стол, если папка существует. Если нет — сохраняем в корень проекта.
    const userProfile = process.env.USERPROFILE || process.env.HOME || ''
    let dataDir = path.join(userProfile, 'Desktop', 'diplom-auto-editor')
    
    if (!fs.existsSync(dataDir)) {
      dataDir = process.cwd()
    }
    
    const imagesDir = path.join(dataDir, 'images')

    // Сохраняем изображения
    if (images && images.length > 0) {
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }
      for (const img of images) {
        const base64 = img.dataURL.replace(/^data:image\/\w+;base64,/, '')
        fs.writeFileSync(path.join(imagesDir, img.filename), Buffer.from(base64, 'base64'))
      }
    }

    // Сохраняем data.json
    fs.writeFileSync(
      path.join(dataDir, 'data.json'),
      JSON.stringify(data, null, 2),
      'utf-8'
    )

    return NextResponse.json({ success: true, imagesCount: images?.length || 0 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
