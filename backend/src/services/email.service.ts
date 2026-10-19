import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import { buildPasswordResetEmail, buildVerificationEmail } from './emailTemplate';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      ...(config.smtp.user && config.smtp.pass
        ? { auth: { user: config.smtp.user, pass: config.smtp.pass } }
        : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
};

export interface SendVerificationEmailInput {
  to: string;
  fullName: string;
  token: string;
}

export interface SendVerificationEmailResult {
  delivered: boolean;
  verificationUrl: string;
}

export interface SendPasswordResetEmailInput {
  to: string;
  fullName: string;
  code: string;
}

/**
 * Send the registration verification email.
 *
 * Never throws: a failed/unconfigured SMTP setup must not turn a successful
 * registration into an error. The caller can still offer "resend email".
 */
export const sendVerificationEmail = async ({
  to,
  fullName,
  token,
}: SendVerificationEmailInput): Promise<SendVerificationEmailResult> => {
  const verificationUrl = `${config.verifyEmailUrl}?token=${encodeURIComponent(token)}`;

  if (!config.isSmtpConfigured) {
    // Only reveal the link in development; never log tokens in production.
    if (config.isDevelopment) {
      console.warn(
        `[email] SMTP chưa được cấu hình. Link xác thực cho ${to}: ${verificationUrl}`
      );
    } else {
      console.warn('[email] SMTP chưa được cấu hình – không thể gửi email xác thực.');
    }
    return { delivered: false, verificationUrl };
  }

  const { subject, html, text } = buildVerificationEmail({ fullName, verifyUrl: verificationUrl });

  try {
    await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      text,
    });
    return { delivered: true, verificationUrl };
  } catch (error) {
    console.error(`[email] Gửi email xác thực tới ${to} thất bại:`, error);
    return { delivered: false, verificationUrl };
  }
};

/**
 * Send a password-reset code email.
 * Never throws: a failed/unconfigured SMTP setup must not expose errors to the client.
 */
export const sendPasswordResetEmail = async ({
  to,
  fullName,
  code,
}: SendPasswordResetEmailInput): Promise<{ delivered: boolean }> => {
  if (!config.isSmtpConfigured) {
    if (config.isDevelopment) {
      console.warn(
        `[email] SMTP chưa được cấu hình. Mã đặt lại mật khẩu cho ${to}: ${code} (log chỉ ở development)`
      );
    } else {
      console.warn('[email] SMTP chưa được cấu hình – không thể gửi email đặt lại mật khẩu.');
    }
    return { delivered: false };
  }

  const { subject, html, text } = buildPasswordResetEmail({ fullName, code });

  try {
    await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      text,
    });
    return { delivered: true };
  } catch (error) {
    console.error(`[email] Gửi email đặt lại mật khẩu tới ${to} thất bại:`, error);
    return { delivered: false };
  }
};
