/**
 * Floor Plan TypeScript Types
 * Type definitions for floor plan management per contracts/expo-api.yaml
 */

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
  createdAt?: string;
  updatedAt?: string;
}

export interface FloorPlanDetail extends FloorPlan {
  booths: BoothSpace[];
}

export interface BoothSpace {
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
    exhibitorId: string;
    companyName: string;
    logo?: string;
  };
}

export interface CreateFloorPlanRequest {
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl?: string;
  metadata?: {
    scale?: number;
  };
}

export interface CreateBoothSpaceRequest {
  identifier: string;
  size: {
    width: number;
    height: number;
  };
  location: {
    x: number;
    y: number;
  };
  amenities?: string[];
  priceTier?: 'standard' | 'premium' | 'deluxe';
}

export interface AssignBoothRequest {
  profileId: string;
}

