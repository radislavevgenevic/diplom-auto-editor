import { NextResponse } from 'next/server'
import { getSessionUser } from '../../../../lib/db'

export async function GET(request) {
  try {
    const user = getSessionUser(request)
    if (!user) {
      return NextResponse.json({ user: null })
    }
    return NextResponse.json({
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
