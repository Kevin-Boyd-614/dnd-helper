import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password, email } = await request.json()

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }
  if (username.trim().length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      username: username.trim().toLowerCase(),
      password_hash,
      email: email?.trim() || null,
    })
    .select('id, username')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create account' }, { status: 500 })
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
