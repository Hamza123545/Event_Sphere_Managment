/**
 * Expo API Service
 * API client functions for expo event endpoints
 * Per contracts/expo-api.yaml
 */

import api from './api';
import type {
  CreateExpoRequest,
  UpdateExpoRequest,
  ExpoDetail,
  ExpoListResponse,
} from '../types/expo';

/**
 * List all expos for the authenticated organizer
 */
export async function listExpos(options?: {
  status?: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}): Promise<ExpoListResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await api.get<{ success: boolean; data: ExpoListResponse }>(
    `/expos${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.data;
}

/**
 * Get expo details by ID
 */
export async function getExpo(expoId: string): Promise<ExpoDetail> {
  const response = await api.get<{ success: boolean; data: ExpoDetail }>(`/expos/${expoId}`);
  return response.data.data;
}

/**
 * Create a new expo event
 * Supports both file upload and JSON
 */
export async function createExpo(data: CreateExpoRequest): Promise<ExpoDetail> {
  // If imageFile is present, use FormData; otherwise use JSON
  if (data.imageFile) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.theme) {
      formData.append('theme', data.theme);
    }
    formData.append('dateRange.startDate', data.dateRange.startDate);
    formData.append('dateRange.endDate', data.dateRange.endDate);
    formData.append('location.venueName', data.location.venueName);
    formData.append('location.address', data.location.address);
    formData.append('location.city', data.location.city);
    formData.append('location.country', data.location.country);
    if (data.location.state) {
      formData.append('location.state', data.location.state);
    }
    if (data.location.zipCode) {
      formData.append('location.zipCode', data.location.zipCode);
    }
    formData.append('expoImage', data.imageFile);
    
    const response = await api.post<{ success: boolean; data: ExpoDetail }>(
      '/expos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } else {
    // Use JSON for regular requests
    const {...jsonData } = data;
    const response = await api.post<{ success: boolean; data: ExpoDetail }>('/expos', jsonData);
    return response.data.data;
  }
}

/**
 * Update an existing expo event
 * Supports both file upload and JSON
 */
export async function updateExpo(expoId: string, data: UpdateExpoRequest & { removeImage?: boolean }): Promise<ExpoDetail> {
  // If imageFile is present, use FormData; otherwise use JSON
  if (data.imageFile || data.removeImage) {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.theme !== undefined) formData.append('theme', data.theme || '');
    if (data.dateRange) {
      formData.append('dateRange.startDate', data.dateRange.startDate);
      formData.append('dateRange.endDate', data.dateRange.endDate);
    }
    if (data.location) {
      if (data.location.venueName) formData.append('location.venueName', data.location.venueName);
      if (data.location.address) formData.append('location.address', data.location.address);
      if (data.location.city) formData.append('location.city', data.location.city);
      if (data.location.country) formData.append('location.country', data.location.country);
      if (data.location.state) formData.append('location.state', data.location.state);
      if (data.location.zipCode) formData.append('location.zipCode', data.location.zipCode);
    }
    if (data.status) formData.append('status', data.status);
    if (data.imageFile) {
      formData.append('expoImage', data.imageFile);
    }
    if (data.removeImage) {
      formData.append('removeImage', 'true');
    }
    
    const response = await api.put<{ success: boolean; data: ExpoDetail }>(
      `/expos/${expoId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } else {
    // Use JSON for regular requests
    const {...jsonData } = data;
    const response = await api.put<{ success: boolean; data: ExpoDetail }>(`/expos/${expoId}`, jsonData);
    return response.data.data;
  }
}

/**
 * Delete an expo event
 */
export async function deleteExpo(expoId: string): Promise<void> {
  await api.delete(`/expos/${expoId}`);
}


