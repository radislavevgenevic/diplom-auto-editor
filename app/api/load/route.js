import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSessionUser, getUserFiles } from '../../../lib/db'

export async function GET(request) {
  try {
    const user = getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Пожалуйста, войдите в систему' }, { status: 401 })
    }

    const { dataFile } = getUserFiles(user.username)

    if (!fs.existsSync(dataFile)) {
      // Инициализируем пустой файл для пользователя
      const defaultData = {
        special: "",
        theme: "",
        group: "",
        name: user.username,
        name_teacher: "",
        name_nor: "",
        year: new Date().getFullYear().toString(),
        template: "D",
        introduction: [],
        sections: [],
        conclusion: [],
        reference: []
      }
      fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2), 'utf-8')
      return NextResponse.json(defaultData)
    }

    const content = fs.readFileSync(dataFile, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

