/**
 * Floor Plan API Service
 * API calls for floor plan management per contracts/expo-api.yaml
 */

import api from './api';
import type {
  FloorPlan,
  FloorPlanDetail,
  BoothSpace,
  CreateFloorPlanRequest,
  CreateBoothSpaceRequest,
  AssignBoothRequest,
} from '../types/floorPlan';

/**
 * Get floor plan for expo
 */
export async function getFloorPlan(expoId: string): Promise<FloorPlanDetail> {
  const response = await api.get<{ success: boolean; data: FloorPlanDetail }>(`/expos/${expoId}/floor-plan`);
  return response.data.data;
}

/**
 * Create floor plan for expo
 * Supports both file upload and imageUrl
 */
export async function createFloorPlan(expoId: string, request: CreateFloorPlanRequest & { imageFile?: File }): Promise<FloorPlan> {
  // If imageFile is present, use FormData; otherwise use JSON
  if (request.imageFile) {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('dimensions.width', request.dimensions.width.toString());
    formData.append('dimensions.height', request.dimensions.height.toString());
    if (request.metadata?.scale) {
      formData.append('metadata.scale', request.metadata.scale.toString());
    }
    formData.append('image', request.imageFile);
    
    const response = await api.post<{ success: boolean; data: FloorPlan }>(
      `/expos/${expoId}/floor-plan`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } else {
    // Use JSON for URL-based image
    const {...jsonRequest } = request;
    const response = await api.post<{ success: boolean; data: FloorPlan }>(`/expos/${expoId}/floor-plan`, jsonRequest);
    return response.data.data;
  }
}

/**
 * Add booth space to floor plan
 */
export async function addBoothSpace(expoId: string, request: CreateBoothSpaceRequest): Promise<BoothSpace> {
  const response = await api.post<{ success: boolean; data: BoothSpace }>(`/expos/${expoId}/booths`, request);
  return response.data.data;
}

/**
 * Assign exhibitor to booth
 */
export async function assignExhibitorToBooth(
  expoId: string,
  boothId: string,
  request: AssignBoothRequest
): Promise<BoothSpace> {
  const response = await api.post<{ success: boolean; data: BoothSpace }>(
    `/expos/${expoId}/booths/${boothId}/assign`,
    request
  );
  return response.data.data;
}

