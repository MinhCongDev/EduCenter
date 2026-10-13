import api from './api';
import type { ApiResponse, CenterInfo } from '../types';

export const centerService = {
  /**
   * UC01: View Center Information
   */
  getCenterInfo: async (): Promise<ApiResponse<CenterInfo>> => {
    const response = await api.get<ApiResponse<CenterInfo>>('/center');
    return response.data;
  },
};
