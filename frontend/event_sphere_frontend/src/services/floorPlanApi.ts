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
 */
export async function createFloorPlan(expoId: string, request: CreateFloorPlanRequest): Promise<FloorPlan> {
  const response = await api.post<{ success: boolean; data: FloorPlan }>(`/expos/${expoId}/floor-plan`, request);
  return response.data.data;
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

