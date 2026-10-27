import api from './api';
import type { Announcement, AnnouncementQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const announcementService = {
  /**
   * View Announcements
   */
  getAnnouncements: async (params?: AnnouncementQueryParams): Promise<PaginatedResponse<Announcement>> => {
    const response = await api.get<PaginatedResponse<Announcement>>('/announcements', { params });
    return response.data;
  },

  /**
   * View Announcement Detail
   */
  getAnnouncementById: async (id: string): Promise<ApiResponse<Announcement>> => {
    const response = await api.get<ApiResponse<Announcement>>(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Create Announcement (Director / Staff)
   */
  createAnnouncement: async (data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await api.post<ApiResponse<Announcement>>('/announcements', data);
    return response.data;
  },

  /**
   * Update Announcement (Director / Staff)
   */
  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await api.put<ApiResponse<Announcement>>(`/announcements/${id}`, data);
    return response.data;
  },

  /**
   * Delete Announcement (Director / Staff)
   */
  deleteAnnouncement: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/announcements/${id}`);
    return response.data;
  },
};
