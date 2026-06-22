import { NextResponse } from 'next/server'
import { readUsers, writeUsers, getSessionUser } from '../../../../lib/db'

export async function POST(request) {
  try {
    const user = getSessionUser(request)
    if (user) {
      const users = readUsers()
      const dbUser = users.find(u => u.id === user.id)
      if (dbUser) {
        dbUser.sessionToken = null
        writeUsers(users)
      }
    }

    const response = NextResponse.json({ success: true })
    
    // Удаляем куку
    response.headers.append(
      'Set-Cookie',
      'session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax'
    )

    return response
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
