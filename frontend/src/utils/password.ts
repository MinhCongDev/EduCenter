// Keep in sync with backend/src/utils/validation.ts
export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{10,20}$/;

export const PASSWORD_POLICY_HINT =
  '10–20 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số, không có khoảng trắng.';

/**
 * Return a Vietnamese error message describing the first violated rule,
 * or null when the password satisfies the policy.
 */
export const getPasswordError = (password: string): string | null => {
  if (password.length < 10 || password.length > 20) {
    return 'Mật khẩu phải có từ 10 đến 20 ký tự.';
  }
  if (/\s/.test(password)) {
    return 'Mật khẩu không được chứa khoảng trắng.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất một chữ thường.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất một chữ hoa.';
  }
  if (!/\d/.test(password)) {
    return 'Mật khẩu phải có ít nhất một chữ số.';
  }
  return null;
};

export const isPasswordValid = (password: string): boolean =>
  PASSWORD_POLICY_REGEX.test(password);
