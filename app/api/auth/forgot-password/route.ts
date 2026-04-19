import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabase } from '@/lib/supabase'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken(): string {
  return crypto.randomUUID()
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, username, email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  // Don't reveal whether the email exists
  if (!user) {
    return NextResponse.json({ success: true })
  }

  const otp = generateOtp()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  await supabase.from('password_recovery_sessions').insert({
    user_id: user.id,
    token,
    otp,
    expires_at: expiresAt,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const resetLink = `${baseUrl}/reset-password?token=${token}`

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"D&D Manager" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject: 'Password Recovery',
    html: `
      <div style="font-family: serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1a1410; color: #e8dcc8;">
        <p style="font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; color: #8b6914; margin: 0 0 16px;">✦ D&D Manager</p>
        <h1 style="font-size: 24px; font-weight: normal; color: #e8dcc8; margin: 0 0 24px;">Password Recovery</h1>
        <p style="color: #a09880; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
          Hi ${user.username}, a password recovery was requested for your account.
          Click the link below and enter the recovery code displayed on your screen.
        </p>
        <a href="${resetLink}" style="display: inline-block; background: #8b2020; border: 1px solid #c9a84c; color: #c9a84c; padding: 12px 28px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; margin-bottom: 24px;">
          Reset Password →
        </a>
        <p style="color: #6b5d4f; font-size: 12px; margin: 0;">This link expires in 5 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  })

  return NextResponse.json({ success: true, otp })
}
