import { NextResponse } from 'next/server'
import { createEmailVerification, isCooldownError } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })
  }

  try {
    const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await createEmailVerification(email)
    await sendVerificationEmail({ to: email, code })
    return NextResponse.json({
      ok: true,
      expiresAt,
      resendAfterSeconds,
      ttlSeconds,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar codigo'

    if (isCooldownError(error)) {
      return NextResponse.json({ error: message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 })
    }

    if (message.includes('SMTP_')) {
      return NextResponse.json({ error: 'Servico de email indisponivel' }, { status: 500 })
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
