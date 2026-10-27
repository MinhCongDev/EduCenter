import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  PlacementTest,
  PlacementTestFormData,
  PlacementTestQueryParams,
} from '../types';

export const placementTestService = {
  async getPlacementTests(params: PlacementTestQueryParams = {}): Promise<PaginatedResponse<PlacementTest>> {
    const response = await api.get<PaginatedResponse<PlacementTest>>('/placement-tests', { params });
    return response.data;
  },

  async createPlacementTest(data: PlacementTestFormData): Promise<ApiResponse<PlacementTest>> {
    const response = await api.post<ApiResponse<PlacementTest>>('/placement-tests', data);
    return response.data;
  },

  async updatePlacementTest(id: string, data: PlacementTestFormData): Promise<ApiResponse<PlacementTest>> {
    const response = await api.put<ApiResponse<PlacementTest>>(`/placement-tests/${id}`, data);
    return response.data;
  },

  async deletePlacementTest(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/placement-tests/${id}`);
    return response.data;
  },
};
