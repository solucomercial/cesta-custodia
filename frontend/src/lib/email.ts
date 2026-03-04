import nodemailer from 'nodemailer'

// Configurações de Identidade Visual (Brand Book)
const COLORS = {
  primary: '#0b4ea2',    // Azul Primário
  background: '#f3f6fb', // Fundo Claro
  white: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280'
}

const LOGO_URL = 'https://solucoesterceirizadas.com.br/images/logo-footer.png'
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
        
        <div style="background-color: ${COLORS.white}; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(11, 78, 162, 0.08); border: 1px solid #e6ebf2;">
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

/**
 * Configuração do Transportador SMTP
 */
function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM
  
  if (!host || !from) {
    throw new Error('Configurações SMTP_HOST e SMTP_FROM são obrigatórias no .env')
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

/**
 * Envia o código de verificação para validação de e-mail ou compra
 */
export async function sendVerificationEmail(params: { to: string; code: string }) {
  const { from } = getSmtpConfig()
  const transporter = getTransporter()

  const html = getBaseTemplate(`
    <h2 style="color: ${COLORS.primary}; margin-top: 0; font-size: 22px; font-weight: 700;">Verificação de Segurança</h2>
    <p style="font-size: 16px;">Olá,</p>
    <p style="font-size: 16px; line-height: 1.5;">Para prosseguir com sua ação na plataforma <strong>Cesta de Custódia</strong>, utilize o código de verificação abaixo:</p>
    
    <div style="background-color: ${COLORS.background}; border: 2px dashed ${COLORS.primary}; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: ${COLORS.primary}; font-family: monospace;">
        ${params.code}
      </span>
    </div>
    
    <p style="font-size: 14px; color: ${COLORS.muted}; margin-bottom: 0;">
      Este código é válido por tempo limitado. Se você não solicitou esta verificação, por favor desconsidere este e-mail.
    </p>
  `)

  await transporter.sendMail({
    from,
    to: params.to,
    subject: `Código de Verificação: ${params.code} - Soluções`,
    text: `Seu código de verificação é: ${params.code}`,
    html,
  })
}

/**
 * Envia o link mágico para login sem senha
 */
export async function sendMagicLinkEmail(params: {
  to: string
  link: string
  expiresAt: Date
}) {
  const { from } = getSmtpConfig()
  const transporter = getTransporter()

  const html = getBaseTemplate(`
    <h2 style="color: ${COLORS.primary}; margin-top: 0; font-size: 22px; font-weight: 700;">Acesso Rápido</h2>
    <p style="font-size: 16px;">Olá,</p>
    <p style="font-size: 16px; line-height: 1.5;">Recebemos uma solicitação de acesso para sua conta. Clique no botão abaixo para entrar no sistema de forma segura:</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${params.link}" 
         style="background-color: ${COLORS.primary}; color: ${COLORS.white}; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">
        Acessar Plataforma
      </a>
    </div>
    
    <p style="font-size: 14px; color: ${COLORS.muted}; line-height: 1.4;">
      Este link expirará em breve. Caso o botão não funcione, copie e cole o link abaixo em seu navegador:
    </p>
    <p style="font-size: 12px; word-break: break-all; color: ${COLORS.primary};">
      ${params.link}
    </p>
  `)

  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Link de Acesso - Cesta de Custódia',
    text: `Acesse o sistema através do link: ${params.link}`,
    html,
  })
}