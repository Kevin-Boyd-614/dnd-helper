import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { JWTPayload } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dnd-manager-dev-secret-change-in-production'
)

export const COOKIE_NAME = 'dnd-session'

export interface SessionPayload {
  userId: string
  username: string
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
