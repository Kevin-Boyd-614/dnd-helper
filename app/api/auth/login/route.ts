import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const token = await signToken({ userId: user.id, username: user.username })
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
