/**
 * HTML + text email templates for auth / account messages.
 * Usage: const { subject, text, html } = buildEmail('changePassword', data);
 */

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const formatExpiry = (expires_at) => new Date(expires_at).toLocaleString();

const wrapLayout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#18181b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold;">
              YourSpeace
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7;">
              If you did not request this, you can ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

const templates = {
    changePassword: ({ code_verifier, expires_at, first_name }) => {
        const name = first_name ? escapeHtml(first_name) : 'there';
        const code = escapeHtml(code_verifier);
        const expiry = escapeHtml(formatExpiry(expires_at));

        return {
            subject: 'YourSpeace — change password code',
            text: `Hi ${first_name || 'there'},\n\nUse this code to change your password: ${code_verifier}\nExpires: ${formatExpiry(expires_at)}\n\nIf you did not request this, ignore this email.`,
            html: wrapLayout(
                'Change password',
                `
              <p style="margin:0 0 12px;font-size:16px;">Hi ${name},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">
                You requested to <strong>change your password</strong>. Use the code below in the app:
              </p>
              <p style="margin:0 0 16px;padding:14px 16px;background:#f4f4f5;border-radius:6px;font-size:20px;letter-spacing:1px;font-family:Consolas,Monaco,monospace;text-align:center;">
                ${code}
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">This code expires on ${expiry}.</p>
            `
            ),
        };
    },

    forgetPassword: ({ code_verifier, expires_at, first_name }) => {
        const name = first_name ? escapeHtml(first_name) : 'there';
        const code = escapeHtml(code_verifier);
        const expiry = escapeHtml(formatExpiry(expires_at));

        return {
            subject: 'YourSpeace — reset password code',
            text: `Hi ${first_name || 'there'},\n\nUse this code to reset your password: ${code_verifier}\nExpires: ${formatExpiry(expires_at)}\n\nIf you did not request this, ignore this email.`,
            html: wrapLayout(
                'Reset password',
                `
              <p style="margin:0 0 12px;font-size:16px;">Hi ${name},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">
                You requested to <strong>reset your password</strong>. Use the code below:
              </p>
              <p style="margin:0 0 16px;padding:14px 16px;background:#f4f4f5;border-radius:6px;font-size:20px;letter-spacing:1px;font-family:Consolas,Monaco,monospace;text-align:center;">
                ${code}
              </p>
              <p style="margin:0;font-size:13px;color:#52525b;">This code expires on ${expiry}.</p>
            `
            ),
        };
    },

    passwordChanged: ({ first_name }) => {
        const name = first_name ? escapeHtml(first_name) : 'there';

        return {
            subject: 'YourSpeace — password changed',
            text: `Hi ${first_name || 'there'},\n\nYour YourSpeace password was changed successfully. If this was not you, reset your password immediately.`,
            html: wrapLayout(
                'Password changed',
                `
              <p style="margin:0 0 12px;font-size:16px;">Hi ${name},</p>
              <p style="margin:0;font-size:14px;line-height:1.5;">
                Your password was <strong>changed successfully</strong>. If you did not do this, use forget-password right away.
              </p>
            `
            ),
        };
    },
};

/**
 * @param {'changePassword'|'forgetPassword'|'passwordChanged'} type
 * @param {object} data
 */
const buildEmail = (type, data = {}) => {
    const builder = templates[type];
    if (!builder) {
        const error = new Error(`Unknown email template: ${type}`);
        error.statusCode = 500;
        throw error;
    }
    return builder(data);
};

module.exports = {
    buildEmail,
    templates,
};
