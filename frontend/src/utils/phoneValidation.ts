/**
 * Vietnamese mobile phone validation.
 * Empty values are allowed; non-empty values must be 10 digits and start
 * with one of the supported prefixes: 03, 05, 07, 08, 09.
 */
export const VIETNAMESE_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const sanitizePhoneInput = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 10);

export const getPhoneValidationError = (value: string): string | null => {
  const phone = value.trim();

  if (!phone) return null;
  if (!/^\d+$/.test(phone)) {
    return 'Số điện thoại chỉ được chứa chữ số.';
  }
  if (phone.length !== 10) {
    return 'Số điện thoại phải có đúng 10 chữ số.';
  }
  if (!VIETNAMESE_PHONE_REGEX.test(phone)) {
    return 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
  }

  return null;
};
