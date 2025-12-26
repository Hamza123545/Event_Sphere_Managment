/**
 * Expo TypeScript Types
 * Type definitions for expo events per contracts/expo-api.yaml
 */

export type ExpoStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface ExpoSummary {
  expoId: string;
  title: string;
  status: ExpoStatus;
  dateRange: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  location: {
    venueName: string;
    city: string;
    country: string;
  };
  imageUrl?: string;
}

export interface ExpoDetail extends ExpoSummary {
  description: string;
  theme?: string;
  location: {
    venueName: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  organizer: {
    userId: string;
    name: string;
  };
  imageUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateExpoRequest {
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  location: {
    venueName: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  imageFile?: File; // Optional image file for upload
}

export interface UpdateExpoRequest {
  title?: string;
  description?: string;
  theme?: string;
  dateRange?: {
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  location?: {
    venueName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  status?: 'draft' | 'upcoming' | 'active' | 'cancelled'; // completed cannot be set manually
  imageFile?: File; // Optional image file for upload
}

export interface ExpoListResponse {
  expos: ExpoSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ExpoUpdatedEvent {
  type: 'expo-updated';
  expoId: string;
  changes: Array<{
    field: 'dateRange' | 'location' | 'title' | 'description' | 'theme' | 'status';
    oldValue: any;
    newValue: any;
  }>;
  expo: {
    title: string;
    description?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    location?: {
      venueName: string;
      address?: string;
      city: string;
      state?: string;
      country: string;
      zipCode?: string;
    };
    theme?: string;
    status?: ExpoStatus;
  };
  timestamp: string;
}

