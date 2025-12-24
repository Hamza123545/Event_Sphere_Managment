/**
 * Approval API Service
 * Handles exhibitor application approval/rejection API calls
 * Implements T154
 */

import api from './api';
import type {
  ListApplicationsResponse,
  ApproveExhibitorResponse,
  RejectExhibitorResponse,
  RejectExhibitorRequest,
  ExhibitorApplication,
} from '../types/approval';

/**
 * List exhibitor applications for an expo
 * GET /expos/:expoId/exhibitors
 */
export async function listApplications(
  expoId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<ExhibitorApplication[]> {
  const params = status ? { status } : {};
  const response = await api.get<ListApplicationsResponse>(`/expos/${expoId}/exhibitors`, {
    params,
  });
  return response.data.data.applications;
}

/**
 * Approve exhibitor application
 * POST /expos/:expoId/exhibitors/:exhibitorId/approve
 */
export async function approveExhibitor(expoId: string, exhibitorId: string): Promise<ExhibitorApplication> {
  const response = await api.post<ApproveExhibitorResponse>(
    `/expos/${expoId}/exhibitors/${exhibitorId}/approve`
  );
  return response.data.data;
}

/**
 * Reject exhibitor application
 * POST /expos/:expoId/exhibitors/:exhibitorId/reject
 */
export async function rejectExhibitor(
  expoId: string,
  exhibitorId: string,
  data: RejectExhibitorRequest
): Promise<ExhibitorApplication> {
  const response = await api.post<RejectExhibitorResponse>(
    `/expos/${expoId}/exhibitors/${exhibitorId}/reject`,
    data
  );
  return response.data.data;
}

