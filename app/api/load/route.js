import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function GET() {
  try {
    // Пытаемся найти папку на рабочем столе, если ее нет — используем текущую рабочую директорию проекта
    const userProfile = process.env.USERPROFILE || process.env.HOME || ''
    let dataDir = path.join(userProfile, 'Desktop', 'diplom-auto-editor')
    let dataFile = path.join(dataDir, 'data.json')

    if (!fs.existsSync(dataFile)) {
      dataDir = process.cwd()
      dataFile = path.join(dataDir, 'data.json')
    }

    if (!fs.existsSync(dataFile)) {
      return NextResponse.json(
        { error: 'Файл data.json не найден в проекте или на Рабочем столе.' },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(dataFile, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
