/**
 * Attendee API Service
 * API calls for attendee functionality per contracts/attendee-api.yaml
 */

import api from './api';
import type {
  ExpoListResponse,
  ExpoDetail,
  SessionListResponse,
  SessionDetail,
  ExhibitorListResponse,
  ExhibitorSearchResult,
  PersonalScheduleResponse,
  BookmarkSessionRequest,
  RegisterForExpoRequest,
} from '../types/attendee';

/**
 * Browse available expos
 */
export async function browseExpos(params?: {
  status?: 'upcoming' | 'active';
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExpoListResponse> {
  const response = await api.get<{ success: boolean; data: ExpoListResponse }>('/attendee/expos', {
    params,
  });
  return response.data.data;
}

/**
 * Get expo details
 */
export async function getExpoDetails(expoId: string): Promise<ExpoDetail> {
  const response = await api.get<{ success: boolean; data: ExpoDetail }>(`/attendee/expos/${expoId}`);
  return response.data.data;
}

/**
 * Register for expo
 */
export async function registerForExpo(
  expoId: string,
  request: RegisterForExpoRequest
): Promise<void> {
  await api.post(`/attendee/expos/${expoId}/register`, request);
}

/**
 * Get expo schedule (sessions)
 */
export async function getSchedule(
  expoId: string,
  params?: {
    category?: string;
    topic?: string;
    date?: string;
  }
): Promise<SessionListResponse> {
  const response = await api.get<{ success: boolean; data: SessionListResponse }>(
    `/attendee/expos/${expoId}/sessions`,
    { params }
  );
  return response.data.data;
}

/**
 * Bookmark session
 */
export async function bookmarkSession(
  expoId: string,
  sessionId: string,
  request?: BookmarkSessionRequest
): Promise<{ session: SessionDetail; conflicts?: Array<{ sessionId: string; title: string; startTime: string; endTime: string }> }> {
  const response = await api.post<{
    success: boolean;
    data: { session: SessionDetail; conflicts?: Array<{ sessionId: string; title: string; startTime: string; endTime: string }> };
  }>(`/attendee/expos/${expoId}/sessions/${sessionId}/bookmark`, request);
  return response.data.data;
}

/**
 * Remove bookmark
 */
export async function removeBookmark(expoId: string, sessionId: string): Promise<void> {
  await api.delete(`/attendee/expos/${expoId}/sessions/${sessionId}/bookmark`);
}

/**
 * Get personal schedule
 */
export async function getPersonalSchedule(): Promise<PersonalScheduleResponse> {
  const response = await api.get<{ success: boolean; data: PersonalScheduleResponse }>('/attendee/schedule');
  return response.data.data;
}

/**
 * Search exhibitors
 */
export async function searchExhibitors(
  expoId: string,
  params?: {
    category?: string;
    productKeyword?: string;
    companyName?: string;
  }
): Promise<ExhibitorListResponse> {
  const response = await api.get<{ success: boolean; data: ExhibitorListResponse }>(
    `/attendee/expos/${expoId}/exhibitors`,
    { params }
  );
  return response.data.data;
}

/**
 * Get exhibitor profile
 */
export async function getExhibitorProfile(
  expoId: string,
  exhibitorId: string
): Promise<ExhibitorSearchResult> {
  const response = await api.get<{ success: boolean; data: ExhibitorSearchResult }>(
    `/attendee/expos/${expoId}/exhibitors/${exhibitorId}`
  );
  return response.data.data;
}

/**
 * View floor plan
 */
export async function viewFloorPlan(expoId: string): Promise<any> {
  const response = await api.get<{ success: boolean; data: any }>(
    `/attendee/expos/${expoId}/floor-plan`
  );
  return response.data.data;
}

