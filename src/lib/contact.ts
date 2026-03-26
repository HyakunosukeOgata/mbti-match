const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || '';
const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() || supportEmail;
const reportEmail = process.env.NEXT_PUBLIC_REPORT_EMAIL?.trim() || supportEmail;

export const contactConfig = {
  supportEmail,
  privacyEmail,
  reportEmail,
  hasAnyEmail: Boolean(supportEmail || privacyEmail || reportEmail),
};
