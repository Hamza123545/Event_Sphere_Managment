/**
 * Exhibitor TypeScript Types
 * Type definitions for exhibitor functionality per contracts/exhibitor-api.yaml
 */

import type { ExpoSummary } from './expo';

// Re-export ExpoSummary for convenience
export type { ExpoSummary };

export interface ExhibitorProfile {
  profileId: string;
  expoId: string;
  expoTitle: string;
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  documents: {
    filename: string;
    url: string;
    uploadedAt: string;
  }[];
  contactInfo: {
    website?: string;
    email: string;
    phone?: string;
  };
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  booth?: BoothDetails;
  createdAt: string;
  updatedAt: string;
}

export interface BoothDetails {
  boothId: string;
  identifier: string;
  size: {
    width: number;
    height: number;
    area: number;
  };
  location: {
    x: number;
    y: number;
  };
  amenities: string[];
  priceTier?: 'standard' | 'premium' | 'deluxe';
  status: 'available' | 'reserved' | 'occupied';
  exhibitor?: {
    profileId: string;
    companyName: string;
  };
  reservedAt?: string;
  productsShowcased?: string[];
  staff?: Array<{
    name: string;
    role: string;
    email: string;
  }>;
}

export interface FloorPlan {
  floorPlanId: string;
  expoId: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl?: string;
  metadata: {
    scale: number;
    totalBooths: number;
    availableBooths: number;
  };
  booths: BoothDetails[];
}

export interface RegisterForExpoRequest {
  companyName: string;
  description: string;
  productsServices: string[];
  category: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  logo?: File;
  documents?: File[];
}

export interface UpdateProfileRequest {
  companyName?: string;
  description?: string;
  productsServices?: string[];
  category?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: File;
  documents?: File[];
}

export interface UpdateBoothDetailsRequest {
  productsShowcased?: string[];
  staff?: Array<{
    name: string;
    role: string;
    email: string;
  }>;
}

export interface BoothAllocatedEvent {
  type: 'booth-allocated';
  boothId: string;
  identifier: string;
  profileId: string;
  expoId: string;
  timestamp: string;
}

export interface BoothReleasedEvent {
  type: 'booth-released';
  boothId: string;
  identifier: string;
  profileId: string;
  expoId: string;
  timestamp: string;
}

export interface ExhibitorProfilesResponse {
  profiles: ExhibitorProfile[];
}

export interface ExpoListResponse {
  expos: ExpoSummary[];
}

