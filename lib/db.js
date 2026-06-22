import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Функция получения директории данных (Рабочий стол или корень проекта)
export function getDataDir() {
  const userProfile = process.env.USERPROFILE || process.env.HOME || ''
  let dataDir = path.join(userProfile, 'Desktop', 'diplom-auto-editor')
  if (!fs.existsSync(dataDir)) {
    dataDir = process.cwd()
  }
  return dataDir
}

export function getUsersPath() {
  return path.join(getDataDir(), 'users.json')
}

// Хеширование пароля
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'salt_diplom_auto_editor').digest('hex')
}

// Чтение пользователей
export function readUsers() {
  const usersPath = getUsersPath()
  if (!fs.existsSync(usersPath)) {
    // Дефолтные пользователи для тестов
    const defaultUsers = [
      {
        id: '1',
        username: 'admin',
        passwordHash: hashPassword('admin'),
        role: 'admin',
        generationsLeft: 'infinite',
        sessionToken: null
      },
      {
        id: '2',
        username: 'teacher',
        passwordHash: hashPassword('teacher'),
        role: 'teacher',
        generationsLeft: 10,
        sessionToken: null
      },
      {
        id: '3',
        username: 'student',
        passwordHash: hashPassword('student'),
        role: 'student',
        generationsLeft: 3,
        sessionToken: null
      }
    ]
    fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2), 'utf-8')
    return defaultUsers
  }
  try {
    const data = fs.readFileSync(usersPath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Ошибка чтения users.json:', err)
    return []
  }
}

// Запись пользователей
export function writeUsers(users) {
  const usersPath = getUsersPath()
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8')
}

// Поиск пользователя по токену сессии
export function getUserByToken(token) {
  if (!token) return null
  const users = readUsers()
  return users.find(u => u.sessionToken === token) || null
}

// Получение сессии из кук запроса (вспомогательная функция для API роутов Next.js)
export function getSessionUser(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const parts = c.trim().split('=')
      return [parts[0], parts.slice(1).join('=')]
    })
  )
  const token = cookies['session_token']
  return getUserByToken(token)
}

// Получение путей к файлам конкретного пользователя
export function getUserFiles(username) {
  const dataDir = getDataDir()
  const dataFile = path.join(dataDir, `data_${username}.json`)
  const imagesDir = path.join(dataDir, `images_${username}`)
  return { dataFile, imagesDir }
}
