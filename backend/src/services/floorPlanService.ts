/**
 * Floor Plan Service
 * Handles floor plan creation and booth space management for organizers
 * Implements FR-012
 */

import { FloorPlan } from '../models/FloorPlan';
import { BoothSpace } from '../models/BoothSpace';
import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { ExpoEvent } from '../models/ExpoEvent';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToExpo } from './realtime';

export interface CreateFloorPlanInput {
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

export interface AddBoothSpaceInput {
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

/**
 * Create floor plan for expo
 * Implements FR-012
 */
export async function createFloorPlan(expoId: string, userId: string, input: CreateFloorPlanInput): Promise<any> {
  try {
    // Verify expo exists and user is organizer
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Verify user owns the expo
    if (expo.organizer.toString() !== userId) {
      throw new CustomError('Unauthorized: You can only create floor plans for your own expos', 403, 'FORBIDDEN');
    }

    // Check if floor plan already exists
    const existingFloorPlan = await FloorPlan.findOne({ expo: expoId });
    if (existingFloorPlan) {
      throw new CustomError('Floor plan already exists for this expo', 409, 'FLOOR_PLAN_EXISTS');
    }

    // Create floor plan
    const floorPlan = new FloorPlan({
      expo: expoId,
      name: input.name,
      dimensions: input.dimensions,
      imageUrl: input.imageUrl,
      metadata: {
        scale: input.metadata?.scale || 10,
        totalBooths: 0,
        availableBooths: 0,
      },
    });

    await floorPlan.save();

    logger.info('Floor plan created', {
      floorPlanId: floorPlan._id.toString(),
      expoId,
      userId,
      name: input.name,
      dimensions: input.dimensions,
      auditTrail: {
        action: 'CREATE_FLOOR_PLAN',
        timestamp: new Date().toISOString(),
        userId,
        expoId,
        details: {
          name: input.name,
          dimensions: input.dimensions,
        },
      },
    });

    return formatFloorPlanResponse(floorPlan);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in createFloorPlan service:', error);
    throw new CustomError('Failed to create floor plan', 500, 'CREATE_FLOOR_PLAN_ERROR');
  }
}

/**
 * Get floor plan for expo
 */
export async function getFloorPlan(expoId: string, userId: string): Promise<any> {
  try {
    // Verify expo exists and user is organizer
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Verify user owns the expo
    if (expo.organizer.toString() !== userId) {
      throw new CustomError('Unauthorized: You can only view floor plans for your own expos', 403, 'FORBIDDEN');
    }

    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (!floorPlan) {
      throw new CustomError('Floor plan not found for this expo', 404, 'FLOOR_PLAN_NOT_FOUND');
    }

    // Get all booths for this expo
    const booths = await BoothSpace.find({ expo: expoId })
      .populate('exhibitor', 'companyName logo')
      .sort({ identifier: 1 });

    return formatFloorPlanDetailResponse(floorPlan, booths);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getFloorPlan service:', error);
    throw new CustomError('Failed to get floor plan', 500, 'GET_FLOOR_PLAN_ERROR');
  }
}

/**
 * Add booth space to floor plan
 * Implements FR-012
 */
export async function addBoothSpace(expoId: string, userId: string, input: AddBoothSpaceInput): Promise<any> {
  try {
    // Verify expo exists and user is organizer
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Verify user owns the expo
    if (expo.organizer.toString() !== userId) {
      throw new CustomError('Unauthorized: You can only add booths to your own expos', 403, 'FORBIDDEN');
    }

    // Verify floor plan exists
    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (!floorPlan) {
      throw new CustomError('Floor plan not found. Please create a floor plan first.', 404, 'FLOOR_PLAN_NOT_FOUND');
    }

    // Check if booth identifier already exists
    const existingBooth = await BoothSpace.findOne({ expo: expoId, identifier: input.identifier });
    if (existingBooth) {
      throw new CustomError('Booth identifier already exists in this expo', 409, 'BOOTH_IDENTIFIER_EXISTS');
    }

    // Create booth space
    const booth = new BoothSpace({
      floorPlan: floorPlan._id,
      expo: expoId,
      identifier: input.identifier,
      size: input.size,
      location: input.location,
      amenities: input.amenities || [],
      priceTier: input.priceTier,
      status: 'available',
    });

    await booth.save();

    // Update floor plan metadata
    floorPlan.metadata.totalBooths += 1;
    floorPlan.metadata.availableBooths += 1;
    await floorPlan.save();

    logger.info('Booth space added', {
      boothId: booth._id.toString(),
      identifier: input.identifier,
      expoId,
      userId,
      auditTrail: {
        action: 'ADD_BOOTH_SPACE',
        timestamp: new Date().toISOString(),
        userId,
        expoId,
        boothId: booth._id.toString(),
        details: {
          identifier: input.identifier,
          size: input.size,
          location: input.location,
          priceTier: input.priceTier,
        },
      },
    });

    return formatBoothResponse(booth);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in addBoothSpace service:', error);
    throw new CustomError('Failed to add booth space', 500, 'ADD_BOOTH_SPACE_ERROR');
  }
}

/**
 * Assign exhibitor to booth
 * Implements FR-012
 */
export async function assignExhibitorToBooth(
  expoId: string,
  boothId: string,
  profileId: string,
  userId: string
): Promise<any> {
  try {
    // Verify expo exists and user is organizer
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Verify user owns the expo
    if (expo.organizer.toString() !== userId) {
      throw new CustomError('Unauthorized: You can only assign booths in your own expos', 403, 'FORBIDDEN');
    }

    // Get exhibitor profile
    const profile = await ExhibitorProfile.findById(profileId);
    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Verify profile belongs to this expo
    if (profile.expo.toString() !== expoId) {
      throw new CustomError('Exhibitor profile does not belong to this expo', 400, 'INVALID_PROFILE');
    }

    // Verify exhibitor is approved
    if (profile.registrationStatus !== 'approved') {
      throw new CustomError('Can only assign booths to approved exhibitors', 400, 'EXHIBITOR_NOT_APPROVED');
    }

    // Get booth
    const booth = await BoothSpace.findById(boothId);
    if (!booth) {
      throw new CustomError('Booth not found', 404, 'BOOTH_NOT_FOUND');
    }

    // Verify booth belongs to this expo
    if (booth.expo.toString() !== expoId) {
      throw new CustomError('Booth does not belong to this expo', 400, 'INVALID_BOOTH');
    }

    // Verify booth is available
    if (booth.status !== 'available') {
      throw new CustomError('Booth is not available for assignment', 400, 'BOOTH_NOT_AVAILABLE');
    }

    // Check if exhibitor already has a booth assigned
    const existingBooth = await BoothSpace.findOne({ expo: expoId, exhibitor: profile._id });
    if (existingBooth) {
      throw new CustomError('Exhibitor already has a booth assigned', 409, 'EXHIBITOR_ALREADY_ASSIGNED');
    }

    // Store previous status for audit trail
    const previousStatus = booth.status;

    // Assign booth (transaction-like operation)
    booth.exhibitor = profile._id as any;
    booth.status = 'occupied';
    await booth.save();

    // Update profile
    profile.booth = booth._id as any;
    await profile.save();

    // Update floor plan metadata
    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (floorPlan) {
      floorPlan.metadata.availableBooths = Math.max(0, floorPlan.metadata.availableBooths - 1);
      await floorPlan.save();
    }

    logger.info('Booth assigned to exhibitor', {
      boothId: booth._id.toString(),
      profileId,
      expoId,
      userId,
      auditTrail: {
        action: 'ASSIGN_BOOTH',
        timestamp: new Date().toISOString(),
        userId,
        expoId,
        boothId: booth._id.toString(),
        profileId,
        details: {
          boothIdentifier: booth.identifier,
          companyName: profile.companyName,
          previousStatus,
          newStatus: booth.status,
        },
      },
    });

    // Broadcast real-time update
    broadcastToExpo(expoId, 'booth-allocated', {
      type: 'booth-allocated',
      expoId,
      booth: {
        boothId: booth._id.toString(),
        identifier: booth.identifier,
        status: booth.status,
        exhibitor: {
          exhibitorId: profile._id.toString(),
          companyName: profile.companyName,
          logo: profile.logo,
        },
      },
      timestamp: new Date().toISOString(),
    });

    return formatBoothResponse(booth, profile);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in assignExhibitorToBooth service:', error);
    throw new CustomError('Failed to assign exhibitor to booth', 500, 'ASSIGN_BOOTH_ERROR');
  }
}

/**
 * Format floor plan for API response
 */
function formatFloorPlanResponse(floorPlan: any): any {
  return {
    floorPlanId: floorPlan._id.toString(),
    expoId: floorPlan.expo.toString(),
    name: floorPlan.name,
    dimensions: floorPlan.dimensions,
    imageUrl: floorPlan.imageUrl,
    metadata: floorPlan.metadata,
    createdAt: floorPlan.createdAt,
    updatedAt: floorPlan.updatedAt,
  };
}

/**
 * Format floor plan with booths for API response
 */
function formatFloorPlanDetailResponse(floorPlan: any, booths: any[]): any {
  return {
    floorPlanId: floorPlan._id.toString(),
    expoId: floorPlan.expo.toString(),
    name: floorPlan.name,
    dimensions: floorPlan.dimensions,
    imageUrl: floorPlan.imageUrl,
    metadata: floorPlan.metadata,
    booths: booths.map((booth: any) => formatBoothResponse(booth, booth.exhibitor)),
    createdAt: floorPlan.createdAt,
    updatedAt: floorPlan.updatedAt,
  };
}

/**
 * Format booth for API response
 */
function formatBoothResponse(booth: any, exhibitor?: any): any {
  return {
    boothId: booth._id.toString(),
    identifier: booth.identifier,
    size: {
      width: booth.size.width,
      height: booth.size.height,
      area: booth.size.area,
    },
    location: booth.location,
    amenities: booth.amenities,
    priceTier: booth.priceTier,
    status: booth.status,
    exhibitor: exhibitor
      ? {
          exhibitorId: exhibitor._id?.toString() || exhibitor.profileId,
          companyName: exhibitor.companyName,
          logo: exhibitor.logo,
        }
      : undefined,
  };
}

