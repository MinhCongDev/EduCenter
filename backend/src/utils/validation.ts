/**
 * Shared validation rules for authentication inputs.
 * Keep PASSWORD_REGEX in sync with frontend/src/utils/password.ts.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 10–20 characters, at least one lowercase, one uppercase and one digit, no whitespace.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{10,20}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Mật khẩu phải có từ 10 đến 20 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số, không chứa khoảng trắng.';

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

export const isValidPassword = (password: string): boolean => PASSWORD_REGEX.test(password);
