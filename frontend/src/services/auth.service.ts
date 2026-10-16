import api from './api';
import type { ApiResponse, AuthResponse, LoginCredentials, RegisterData, User } from '../types';

const TOKEN_KEY = 'educenter_token';
const USER_KEY = 'educenter_user';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  dob?: string;
  avatarUrl?: string;
}

export const authService = {
  /**
   * Login with email and password
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
   * Register a new account (Guest → Student by default)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (
    payload: UpdateProfilePayload
  ): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', payload);
    if (response.data.success && response.data.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/change-password', payload);
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
