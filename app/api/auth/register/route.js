import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { readUsers, writeUsers, hashPassword, getUserFiles } from '../../../../lib/db'
import fs from 'fs'

export async function POST(request) {
  try {
    const { username, password, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Пожалуйста, введите имя пользователя и пароль' }, { status: 400 })
    }

    const cleanUsername = username.trim().toLowerCase()
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Имя пользователя должно быть не менее 3 символов' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 4 символов' }, { status: 400 })
    }

    const users = readUsers()

    // Проверка на уникальность имени
    if (users.some(u => u.username === cleanUsername)) {
      return NextResponse.json({ error: 'Пользователь с таким именем уже существует' }, { status: 400 })
    }

    // Создание сессионного токена
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const newUser = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      passwordHash: hashPassword(password),
      role: role === 'teacher' ? 'teacher' : 'student', // Ученик по умолчанию
      generationsLeft: 5, // 5 бесплатных генераций при регистрации
      sessionToken
    }

    users.push(newUser)
    writeUsers(users)

    // Создание базового файла data_username.json для нового пользователя
    const { dataFile } = getUserFiles(cleanUsername)
    if (!fs.existsSync(dataFile)) {
      const defaultData = {
        special: "",
        theme: "",
        group: "",
        name: username,
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
    }

    // Формируем ответ с установкой куки
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        generationsLeft: newUser.generationsLeft
      }
    })

    // Установка cookie сессии на 7 дней
    response.headers.append(
      'Set-Cookie',
      `session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`
    )

    return response
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
