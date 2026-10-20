import api from './api';
import type { Announcement, AnnouncementQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const announcementService = {
  /**
   * UC06: View Announcements
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
};
