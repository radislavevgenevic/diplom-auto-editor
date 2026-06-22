import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { getSessionUser, readUsers, writeUsers } from '../../../lib/db'

export async function POST(request) {
  let tempDir = null
  try {
    const user = getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Пожалуйста, войдите в систему' }, { status: 401 })
    }

    // Проверка лимитов генераций
    const users = readUsers()
    const dbUser = users.find(u => u.id === user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (dbUser.generationsLeft !== 'infinite') {
      const left = parseInt(dbUser.generationsLeft, 10)
      if (isNaN(left) || left <= 0) {
        return NextResponse.json({ error: 'LIMIT_EXCEEDED', message: 'У вас закончились доступные генерации' }, { status: 403 })
      }
      // Декрементируем
      dbUser.generationsLeft = left - 1
      writeUsers(users)
    }

    const { data, images } = await request.json()

    // 1. Создаем уникальную временную папку в ОС для предотвращения конфликтов параллельных запросов
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-gen-'))

    const imagesDir = path.join(tempDir, 'images')
    const dataFile  = path.join(tempDir, 'data.json')
    const resultFile = path.join(tempDir, 'result.docx')

    // 2. Копируем скрипт generate.py во временную папку
    const srcScript = path.join(process.cwd(), 'public', 'generate.py')
    fs.copyFileSync(srcScript, path.join(tempDir, 'generate.py'))

    // 3. Копируем все шаблоны template*.docx во временную папку
    const templates = ['templateD.docx', 'templateK.docx', 'templateO.docx']
    for (const tpl of templates) {
      const srcTpl = path.join(process.cwd(), 'public', tpl)
      if (fs.existsSync(srcTpl)) {
        fs.copyFileSync(srcTpl, path.join(tempDir, tpl))
      }
    }

    // 4. Сохраняем переданные изображения
    if (images?.length > 0) {
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }
      for (const img of images) {
        const base64 = img.dataURL.replace(/^data:image\/\w+;base64,/, '')
        fs.writeFileSync(path.join(imagesDir, img.filename), Buffer.from(base64, 'base64'))
      }
    }

    // 5. Сохраняем data.json
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8')

    // 6. Запускаем generate.py в контексте временной папки (cwd: tempDir)
    let stderr = ''
    const runPython = (cmd) => {
      execSync(cmd, { 
        cwd: tempDir, 
        timeout: 120_000,
        env: { ...process.env, PROJECT_DIR: process.cwd() }
      })
    }

    try {
      runPython('python generate.py')
    } catch (e1) {
      try {
        runPython('python3 generate.py')
      } catch (e2) {
        stderr = e1.stderr?.toString() || e1.message || ''
        throw new Error(`Ошибка запуска Python скрипта:\n${stderr || e2.message}`)
      }
    }

    // 7. Проверяем, что result.docx успешно сгенерирован
    if (!fs.existsSync(resultFile)) {
      throw new Error('Файл result.docx не был создан генератором.')
    }

    // 8. Читаем готовый файл в буфер
    const buffer = fs.readFileSync(resultFile)

    // 9. Очищаем за собой временную папку
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
      tempDir = null // Сбрасываем, чтобы повторно не удалять в блоке finally
    } catch (cleanErr) {
      console.error('Ошибка при удалении временной папки:', cleanErr)
    }

    // 10. Возвращаем файл пользователю
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''result.docx`,
      },
    })
  } catch (err) {
    // В случае ошибки обязательно пытаемся подчистить за собой
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (cleanErr) {
        console.error('Ошибка при удалении временной папки после сбоя:', cleanErr)
      }
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
