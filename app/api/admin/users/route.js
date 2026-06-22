import { NextResponse } from 'next/server'
import { getSessionUser, readUsers, writeUsers } from '../../../../lib/db'

// Проверка прав администратора
function checkAdmin(request) {
  const user = getSessionUser(request)
  return user && user.role === 'admin'
}

export async function GET(request) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const users = readUsers()
    // Убираем хэш пароля перед отправкой
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      generationsLeft: u.generationsLeft
    }))

    return NextResponse.json({ users: safeUsers })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { userId, role, generationsLeft } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'Не указан ID пользователя' }, { status: 400 })
    }

    const users = readUsers()
    const user = users.find(u => u.id === userId)
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Обновляем роль
    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      user.role = role
    }

    // Обновляем лимит генераций
    if (generationsLeft !== undefined) {
      if (generationsLeft === 'infinite') {
        user.generationsLeft = 'infinite'
      } else {
        const val = parseInt(generationsLeft, 10)
        user.generationsLeft = isNaN(val) ? 0 : val
      }
    }

    writeUsers(users)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        generationsLeft: user.generationsLeft
      }
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
