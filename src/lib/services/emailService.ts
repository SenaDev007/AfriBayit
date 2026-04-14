import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Check if SMTP configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP configuration missing. Emails will be logged to console only.')
      this.transporter = null as any
      return
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendVerificationCode(to: string, code: string, firstName?: string) {
    const subject = 'Code de vérification AfriBayit'
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de vérification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">AfriBayit</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Plateforme immobilière d'Afrique</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Code de vérification</h2>
          ${firstName ? `<p>Bonjour ${firstName},</p>` : '<p>Bonjour,</p>'}
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant pour continuer :</p>
          
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <h3 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h3>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>&copy; 2024 AfriBayit. Tous droits réservés.</p>
        </div>
      </body>
      </html>
    `

    const text = `
      Code de vérification AfriBayit
      
      ${firstName ? `Bonjour ${firstName},` : 'Bonjour,'}
      
      Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant pour continuer :
      
      ${code}
      
      Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      © 2024 AfriBayit. Tous droits réservés.
    `

    return this.sendEmail({ to, subject, html, text })
  }

  private async sendEmail({ to, subject, html, text }: EmailOptions) {
    // If SMTP is not configured, just log the email content
    if (!this.transporter) {
      console.log('='.repeat(60))
      console.log('📧 EMAIL WOULD BE SENT:')
      console.log('='.repeat(60))
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log('Content:')
      console.log(text)
      console.log('='.repeat(60))
      return { success: true, messageId: 'console-log' }
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"AfriBayit" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      })

      console.log('Email sent successfully:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Email sending failed:', error)
      throw new Error('Erreur lors de l\'envoi de l\'email')
    }
  }
}

export const emailService = new EmailService()
