import api from './api';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  UpdateProfileData,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  ApiResponse,
} from '../types';

const TOKEN_KEY = 'educenter_token';
const USER_KEY = 'educenter_user';

// ===========================
// Auth Service
// ===========================

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
   * UC08: Register a new account (Guest -> Student)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
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
   * UC11: Forgot Password - Request code/token
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse<{ email: string; resetCode: string }>> => {
    const response = await api.post<ApiResponse<{ email: string; resetCode: string }>>('/auth/forgot-password', data);
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
