import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

class EmailService {
  async send({ to, subject, html, text }) {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
  }

  queue(payload) {
    setImmediate(async () => {
      try {
        await this.send(payload);
      } catch (error) {
        logger.error('Failed to send email', {
          to: payload.to,
          error: error.message,
        });
      }
    });
  }
}

export const emailService = new EmailService();
