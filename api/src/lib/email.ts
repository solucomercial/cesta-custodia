import nodemailer from 'nodemailer'

// Configurações de estilo e assets
const COLORS = {
  primary: '#0b4ea2',
  background: '#f4f7fa',
  text: '#2d3748',
  muted: '#718096',
  white: '#ffffff',
  accent: '#e6ebf2'
}

// URL da logo (idealmente vinda de variável de ambiente)
const LOGO_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/logo-horizontal.png` 
  : 'https://solucoesterceirizadas.com.br/images/logo-footer.png'

const DEFAULT_PORT = 587

/**
 * Gera o invólucro HTML padrão para todos os e-mails do sistema
 */
function getBaseTemplate(content: string) {
  return `
    <div style="background-color: ${COLORS.background}; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${COLORS.text}; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="Soluções Serviços Terceirizados" style="height: 60px; width: auto;">
        </div>
        
        <div style="background-color: ${COLORS.white}; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(11, 78, 162, 0.08); border: 1px solid ${COLORS.accent};">
          ${content}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: ${COLORS.muted}; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0;"><strong>Soluções Serviços Terceirizados LTDA</strong></p>
          <p style="margin: 0;">CNPJ: 09.445.502/0001-09</p>
          <p style="margin: 10px 0 0 0;">Este é um e-mail transacional automático.<br>Por favor, não responda a este remetente.</p>
        </div>
      </div>
    </div>
  `
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM
  const user = process.env.SMTP_USER

  console.log('SMTP: Verificando configurações...')
  console.log(
    `SMTP: Host=${host}, From=${from}, User=${user ? 'Definido' : 'NÃO DEFINIDO'}`,
  )

  if (!host || !from) {
    console.error('SMTP: Falha na configuração - SMTP_HOST ou SMTP_FROM ausentes')
    throw new Error('SMTP_HOST e SMTP_FROM sao obrigatorios')
  }

  const port = Number(process.env.SMTP_PORT ?? DEFAULT_PORT)
  const secureEnv = process.env.SMTP_SECURE
  const secure = secureEnv ? secureEnv === 'true' : port === 465
  const pass = process.env.SMTP_PASS

  return {
    host,
    from,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  }
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter(config?: ReturnType<typeof getSmtpConfig>) {
  if (!cachedTransporter) {
    const resolved = config ?? getSmtpConfig()
    cachedTransporter = nodemailer.createTransport({
      host: resolved.host,
      port: resolved.port,
      secure: resolved.secure,
      auth: resolved.auth,
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
  console.log(`SMTP: Preparando envio de Magic Link para ${params.to}`)
  const config = getSmtpConfig()
  const { from } = config
  const transporter = getTransporter(config)

  const content = `
    <h2 style="color: ${COLORS.primary}; margin-top: 0;">Olá,</h2>
    <p>Use o link abaixo para entrar no sistema <strong>Cesta de Custódia</strong>:</p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.link}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Acessar Sistema
      </a>
    </div>
    <p style="font-size: 14px; color: ${COLORS.muted};">Ou copie e cole o link no seu navegador:</p>
    <p style="word-break: break-all; font-size: 12px;"><a href="${params.link}">${params.link}</a></p>
    <hr style="border: 0; border-top: 1px solid ${COLORS.accent}; margin: 20px 0;">
    <p style="font-size: 12px; color: ${COLORS.muted}; text-align: center;">Este link expira em ${params.expiresAt.toLocaleString('pt-BR')}.</p>
  `

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: 'Link de Acesso - Cesta de Custódia',
      text: `Acesse o sistema através do link: ${params.link}`,
      html: getBaseTemplate(content),
    })

    const response = (info as { response?: unknown }).response
    console.log('SMTP: Resposta do servidor de e-mail:', response ?? info)
  } catch (error) {
    console.error('SMTP: Erro ao enviar e-mail via Nodemailer:')
    console.error(error)
    throw error
  }
}

export async function sendVerificationEmail(params: {
  to: string
  code: string
}) {
  const config = getSmtpConfig()
  const { from } = config
  const transporter = getTransporter(config)

  const content = `
    <h2 style="color: ${COLORS.primary}; margin-top: 0;">Olá,</h2>
    <p>Seu código de verificação para a <strong>Cesta de Custódia</strong> é:</p>
    <div style="margin: 30px 0; text-align: center; background-color: ${COLORS.background}; padding: 20px; border-radius: 8px; border: 1px dashed ${COLORS.primary};">
      <strong style="font-size: 32px; letter-spacing: 8px; color: ${COLORS.primary};">${params.code}</strong>
    </div>
    <p>Insira este código na tela de verificação para continuar o seu cadastro.</p>
    <p style="font-size: 14px; color: ${COLORS.muted};">Se você não solicitou este código, por favor ignore este e-mail.</p>
  `

  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Código de Verificação - Cesta de Custódia',
    text: `Seu código de verificação é: ${params.code}`,
    html: getBaseTemplate(content),
  })
}