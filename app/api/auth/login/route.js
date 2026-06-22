import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { readUsers, writeUsers, hashPassword } from '../../../../lib/db'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Пожалуйста, введите имя пользователя и пароль' }, { status: 400 })
    }

    const cleanUsername = username.trim().toLowerCase()
    const users = readUsers()

    const user = users.find(u => u.username === cleanUsername)
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 400 })
    }

    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 400 })
    }

    // Создание сессионного токена
    const sessionToken = crypto.randomBytes(32).toString('hex')
    user.sessionToken = sessionToken
    writeUsers(users)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        generationsLeft: user.generationsLeft
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
