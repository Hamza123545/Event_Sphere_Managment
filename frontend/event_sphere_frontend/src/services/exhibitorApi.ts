/**
 * Exhibitor API Service
 * API client functions for exhibitor endpoints
 * Per contracts/exhibitor-api.yaml
 */

import api from './api';
import type {
  ExhibitorProfile,
  ExhibitorProfilesResponse,
  RegisterForExpoRequest,
  UpdateProfileRequest,
  UpdateBoothDetailsRequest,
  FloorPlan,
  BoothDetails,
  ExpoListResponse,
} from '../types/exhibitor';

/**
 * Browse available expos
 */
export async function browseExpos(options?: {
  status?: 'upcoming' | 'active';
  category?: string;
}): Promise<ExpoListResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.category) params.append('category', options.category);

  const response = await api.get<{ success: boolean; data: ExpoListResponse }>(
    `/exhibitor/expos${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.data;
}

/**
 * Register for expo
 */
export async function registerForExpo(
  expoId: string,
  data: RegisterForExpoRequest
): Promise<ExhibitorProfile> {
  const formData = new FormData();
  
  formData.append('companyName', data.companyName);
  formData.append('description', data.description);
  formData.append('productsServices', JSON.stringify(data.productsServices));
  formData.append('category', data.category);
  formData.append('contactEmail', data.contactEmail);
  if (data.contactPhone) formData.append('contactPhone', data.contactPhone);
  if (data.website) formData.append('website', data.website);
  if (data.logo) formData.append('logo', data.logo);
  if (data.documents) {
    data.documents.forEach((doc) => {
      formData.append('documents', doc);
    });
  }

  const response = await api.post<{ success: boolean; message: string; data: ExhibitorProfile }>(
    `/exhibitor/expos/${expoId}/register`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Get all exhibitor profiles for authenticated user
 */
export async function getProfiles(): Promise<ExhibitorProfile[]> {
  const response = await api.get<{ success: boolean; data: ExhibitorProfilesResponse }>(
    '/exhibitor/profile'
  );
  return response.data.data.profiles;
}

/**
 * Get exhibitor profile details
 */
export async function getProfile(profileId: string): Promise<ExhibitorProfile> {
  const response = await api.get<{ success: boolean; data: ExhibitorProfile }>(
    `/exhibitor/profile/${profileId}`
  );
  return response.data.data;
}

/**
 * Update exhibitor profile
 */
export async function updateProfile(
  profileId: string,
  data: UpdateProfileRequest
): Promise<ExhibitorProfile> {
  const formData = new FormData();
  
  if (data.companyName) formData.append('companyName', data.companyName);
  if (data.description) formData.append('description', data.description);
  if (data.productsServices) formData.append('productsServices', JSON.stringify(data.productsServices));
  if (data.category) formData.append('category', data.category);
  if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
  if (data.contactPhone !== undefined) formData.append('contactPhone', data.contactPhone || '');
  if (data.website !== undefined) formData.append('website', data.website || '');
  if (data.logo) formData.append('logo', data.logo);
  if (data.documents) {
    data.documents.forEach((doc) => {
      formData.append('documents', doc);
    });
  }

  const response = await api.put<{ success: boolean; message: string; data: ExhibitorProfile }>(
    `/exhibitor/profile/${profileId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * View floor plan for expo
 */
export async function viewFloorPlan(expoId: string): Promise<FloorPlan> {
  const response = await api.get<{ success: boolean; data: FloorPlan }>(
    `/exhibitor/expos/${expoId}/floor-plan`
  );
  return response.data.data;
}

/**
 * Reserve booth
 */
export async function reserveBooth(
  expoId: string,
  boothId: string,
  profileId: string
): Promise<BoothDetails> {
  const response = await api.post<{ success: boolean; message: string; data: BoothDetails }>(
    `/exhibitor/expos/${expoId}/booths/${boothId}/reserve`,
    { profileId }
  );
  return response.data.data;
}

/**
 * Get assigned booth details
 */
export async function getAssignedBooth(profileId: string): Promise<BoothDetails> {
  const response = await api.get<{ success: boolean; data: BoothDetails }>(
    `/exhibitor/profile/${profileId}/booth`
  );
  return response.data.data;
}

/**
 * Update booth details
 */
export async function updateBoothDetails(
  profileId: string,
  data: UpdateBoothDetailsRequest
): Promise<void> {
  await api.put<{ success: boolean; message: string }>(
    `/exhibitor/profile/${profileId}/booth`,
    data
  );
}

