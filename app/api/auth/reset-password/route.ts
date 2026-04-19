import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { token, otp, newPassword } = await request.json()

  if (!token || !otp || !newPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('password_recovery_sessions')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired recovery link' }, { status: 400 })
  }

  if (new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Recovery link has expired' }, { status: 400 })
  }

  if (session.otp !== otp.trim()) {
    return NextResponse.json({ error: 'Incorrect recovery code' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(newPassword, 12)

  await supabase.from('users').update({ password_hash }).eq('id', session.user_id)
  await supabase.from('password_recovery_sessions').update({ used: true }).eq('id', session.id)

  return NextResponse.json({ success: true })
}
