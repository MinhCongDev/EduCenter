/**
 * HTML/text templates for transactional emails.
 * Adapted from the StudyStudio verification email, rebranded for EduCenter.
 */

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export interface VerificationEmailContent {
  subject: string;
  html: string;
  text: string;
}

export const buildVerificationEmail = ({
  fullName,
  verifyUrl,
}: {
  fullName: string;
  verifyUrl: string;
}): VerificationEmailContent => {
  const safeName = escapeHtml(fullName || 'bạn');
  const safeUrl = escapeHtml(verifyUrl);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác thực tài khoản EduCenter</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0"
    style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#07403F,#0B5A58);padding:45px 30px;text-align:center;color:#ffffff;">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#57D061;font-weight:700;margin-bottom:10px;">
          EduCenter
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:700;">Xác thực tài khoản của bạn</h1>
      </td>
    </tr>

    <tr>
      <td style="padding:40px 35px;color:#333333;font-size:15px;line-height:1.7;">
        <p>Xin chào <strong>${safeName}</strong>,</p>

        <p>
          Cảm ơn bạn đã đăng ký tài khoản tại <strong>EduCenter</strong>.
          Hãy xác thực địa chỉ email để kích hoạt tài khoản và bắt đầu lộ trình học tập của bạn.
        </p>

        <div style="text-align:center;margin:35px 0;">
          <a href="${safeUrl}"
             style="background:#EC6E23;color:#ffffff;padding:15px 34px;text-decoration:none;
                    font-weight:700;border-radius:40px;display:inline-block;font-size:16px;
                    box-shadow:0 8px 20px rgba(236,110,35,0.4);">
            Xác thực ngay
          </a>
        </div>

        <p style="font-size:14px;color:#666666;margin-top:20px;">
          Hoặc sao chép liên kết sau vào trình duyệt:
        </p>

        <p style="word-break:break-all;background:#fff5ee;padding:12px 14px;border-radius:10px;
                  font-size:13px;color:#EC6E23;">
          ${safeUrl}
        </p>

        <div style="margin-top:25px;padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;
                    border-radius:12px;font-size:14px;color:#166534;">
          Liên kết sẽ hết hạn sau <strong>15 phút</strong>.
        </div>

        <hr style="margin:35px 0;border:none;border-top:1px solid #eeeeee;" />

        <p style="font-size:13px;color:#888888;">
          Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email.
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#fafafa;padding:25px;text-align:center;font-size:12px;color:#999999;">
        © ${new Date().getFullYear()} EduCenter – Training Center Management System
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Xin chào ${fullName || 'bạn'},`,
    '',
    'Cảm ơn bạn đã đăng ký tài khoản tại EduCenter.',
    'Hãy mở liên kết sau để xác thực email và kích hoạt tài khoản:',
    verifyUrl,
    '',
    'Liên kết sẽ hết hạn sau 15 phút.',
    'Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email.',
  ].join('\n');

  return {
    subject: 'Xác thực tài khoản EduCenter của bạn',
    html,
    text,
  };
};
