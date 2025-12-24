/**
 * Analytics API Service
 * Handles analytics API calls
 * Implements T186
 */

import api from './api';
import type { Analytics, GetAnalyticsResponse } from '../types/analytics';

/**
 * Get analytics for an expo
 * GET /expos/:expoId/analytics
 */
export async function getAnalytics(expoId: string, metricType?: string): Promise<Analytics> {
  const params = new URLSearchParams();
  if (metricType) params.append('metricType', metricType);

  const response = await api.get<GetAnalyticsResponse>(
    `/expos/${expoId}/analytics${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.data;
}

/**
 * Export analytics report
 * GET /expos/:expoId/analytics/export
 */
export async function exportAnalytics(
  expoId: string,
  format: 'pdf' | 'csv' | 'json'
): Promise<Blob | string> {
  const response = await api.get(`/expos/${expoId}/analytics/export?format=${format}`, {
    responseType: format === 'json' ? 'json' : 'blob',
  });

  if (format === 'json') {
    return JSON.stringify(response.data, null, 2);
  }

  return response.data as Blob;
}

