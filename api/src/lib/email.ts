import nodemailer from 'nodemailer'

const DEFAULT_PORT = 587

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM

  if (!host || !from) {
    throw new Error('SMTP_HOST e SMTP_FROM sao obrigatorios')
  }

  const port = Number(process.env.SMTP_PORT ?? DEFAULT_PORT)
  const secureEnv = process.env.SMTP_SECURE
  const secure = secureEnv ? secureEnv === 'true' : port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  return {
    host,
    from,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  }
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!cachedTransporter) {
    const config = getSmtpConfig()
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  return cachedTransporter
}

export async function sendMagicLinkEmail(params: {
  to: string
  link: string
  expiresAt: Date
}) {
  const { from } = getSmtpConfig()
  const transporter = getTransporter()

  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Link de Acesso - Cesta de Custodia',
    text: `Acesse o sistema atraves do link: ${params.link}`,
    html: `
      <p>Ola,</p>
      <p>Use o link abaixo para entrar no sistema:</p>
      <p><a href="${params.link}">${params.link}</a></p>
      <p>Este link expira em ${params.expiresAt.toISOString()}.</p>
    `,
  })
}
