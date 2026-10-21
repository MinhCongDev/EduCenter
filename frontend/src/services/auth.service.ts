import api from './api';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  RegisterResponse,
  User,
  UpdateProfileData,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
} from '../types';

const TOKEN_KEY = 'educenter_token';
const USER_KEY = 'educenter_user';

export const authService = {
  /**
   * UC09: Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * UC08: Register a new account (Guest -> Student).
   * The account must verify its email before it can log in, so no token is stored.
   */
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Verify an email address using the token from the registration email.
   */
  verifyEmail: async (token: string): Promise<ApiResponse<{ email: string }>> => {
    const response = await api.get<ApiResponse<{ email: string }>>('/auth/verify-email', {
      params: { token },
    });
    return response.data;
  },

  /**
   * Resend the registration verification email.
   */
  resendVerificationEmail: async (
    email: string
  ): Promise<ApiResponse<{ email: string }>> => {
    const response = await api.post<ApiResponse<{ email: string }>>(
      '/auth/resend-email-verify',
      { email }
    );
    return response.data;
  },

  /**
   * Sign in / sign up with a Google ID token.
   */
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.get('/auth/me');
    if (response.data.success && response.data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * UC07: Update Personal Information
   */
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    if (response.data.success && response.data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * UC10: Change Password
   */
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  /**
   * UC11: Forgot Password - request a code sent to the registered email
   */
forgotPassword: async (
    data: ForgotPasswordData
  ): Promise<ApiResponse<{ email: string; expiresInMinutes: number }>> => {
    const response = await api.post<ApiResponse<{ email: string; expiresInMinutes: number }>>(
      '/auth/forgot-password',
      data
    );
    return response.data;
  },

  /**
   * UC11: Reset Password - Verify code and set new password
   */
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Upload avatar (multipart/form-data)
   * Returns the updated user
   */
  uploadAvatar: async (file: File): Promise<ApiResponse<{ user: User }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<ApiResponse<{ user: User }>>(
      '/auth/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    if (response.data.success && response.data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Logout – clear local storage
   */
  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get stored token
   */
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
