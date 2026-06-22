import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSessionUser, getUserFiles } from '../../../lib/db'

export async function POST(request) {
  try {
    const user = getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Пожалуйста, войдите в систему' }, { status: 401 })
    }

    const { data, images } = await request.json()
    const { dataFile, imagesDir } = getUserFiles(user.username)

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

    // Сохраняем data_[username].json
    fs.writeFileSync(
      dataFile,
      JSON.stringify(data, null, 2),
      'utf-8'
    )

    return NextResponse.json({ success: true, imagesCount: images?.length || 0 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

