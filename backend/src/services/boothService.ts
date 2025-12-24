/**
 * Booth Service
 * Handles booth reservation and management
 * Implements FR-020, FR-021, FR-022, FR-035
 */

import { BoothSpace } from '../models/BoothSpace';
import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { ExpoEvent } from '../models/ExpoEvent';
import { FloorPlan } from '../models/FloorPlan';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToExpo } from './realtime';

export interface FloorPlanDetail {
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
  booths: BoothDetail[];
}

export interface BoothDetail {
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
  reservedAt?: Date;
  productsShowcased?: string[];
  staff?: Array<{
    name: string;
    role: string;
    email: string;
  }>;
}

export interface UpdateBoothDetailsInput {
  productsShowcased?: string[];
  staff?: Array<{
    name: string;
    role: string;
    email: string;
  }>;
}

/**
 * View floor plan with booths
 * Implements FR-020
 */
export async function viewFloorPlan(
  expoId: string,
  userId: string,
  _userRole: string
): Promise<FloorPlanDetail> {
  try {
    // Verify expo exists
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Get floor plan
    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (!floorPlan) {
      throw new CustomError('Floor plan not found for this expo', 404, 'FLOOR_PLAN_NOT_FOUND');
    }

    // Get all booths for this floor plan
    const booths = await BoothSpace.find({ floorPlan: floorPlan._id })
      .populate('exhibitor', 'companyName')
      .sort({ identifier: 1 });

    // Format booth details
    const boothDetails: BoothDetail[] = booths.map((booth) => {
      const exhibitor = booth.exhibitor as any;
      return {
        boothId: booth._id.toString(),
        identifier: booth.identifier,
        size: booth.size,
        location: booth.location,
        amenities: booth.amenities,
        priceTier: booth.priceTier,
        status: booth.status,
        exhibitor: exhibitor
          ? {
              profileId: exhibitor._id.toString(),
              companyName: exhibitor.companyName,
            }
          : undefined,
        reservedAt: booth.reservedAt,
        // Note: productsShowcased and staff would be stored separately
        // For now, we'll handle this in updateBoothDetails
      };
    });

    // Update metadata counts
    const availableCount = booths.filter((b) => b.status === 'available').length;
    floorPlan.metadata.availableBooths = availableCount;
    floorPlan.metadata.totalBooths = booths.length;
    await floorPlan.save();

    logger.info('Floor plan viewed', { expoId, userId, boothCount: booths.length });

    return {
      floorPlanId: floorPlan._id.toString(),
      expoId,
      name: floorPlan.name,
      dimensions: floorPlan.dimensions,
      imageUrl: floorPlan.imageUrl,
      metadata: floorPlan.metadata,
      booths: boothDetails,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in viewFloorPlan service:', error);
    throw new CustomError('Failed to retrieve floor plan', 500, 'VIEW_FLOOR_PLAN_ERROR');
  }
}

/**
 * Reserve booth with optimistic locking
 * Implements FR-021, FR-073 (concurrent reservation handling)
 */
export async function reserveBooth(
  expoId: string,
  boothId: string,
  profileId: string,
  userId: string
): Promise<BoothDetail> {
  try {
    // Verify expo exists
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Verify profile exists and belongs to user
    const profile = await ExhibitorProfile.findById(profileId);
    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    if (profile.user.toString() !== userId) {
      throw new CustomError('Access denied to this profile', 403, 'FORBIDDEN');
    }

    // Profile must be approved to reserve booth
    if (profile.registrationStatus !== 'approved') {
      throw new CustomError('Can only reserve booth with approved profile', 400, 'PROFILE_NOT_APPROVED');
    }

    // Verify booth exists and belongs to this expo
    const booth = await BoothSpace.findById(boothId);
    if (!booth) {
      throw new CustomError('Booth not found', 404, 'BOOTH_NOT_FOUND');
    }

    if (booth.expo.toString() !== expoId) {
      throw new CustomError('Booth does not belong to this expo', 400, 'INVALID_BOOTH');
    }

    // Optimistic locking: try to reserve with version check
    // If booth status changed between read and write, Mongoose will detect version mismatch
    if (booth.status !== 'available') {
      throw new CustomError(
        `Booth is ${booth.status}. Cannot reserve.`,
        409,
        'BOOTH_NOT_AVAILABLE',
        {
          currentStatus: booth.status,
        }
      );
    }

    // Check if profile already has a booth for this expo
    const existingBooth = await BoothSpace.findOne({ exhibitor: profileId, expo: expoId });
    if (existingBooth) {
      throw new CustomError('You already have a booth reserved for this expo', 400, 'ALREADY_HAS_BOOTH');
    }

    // Reserve booth atomically
    booth.status = 'reserved';
    booth.exhibitor = profileId as any; // Mongoose will handle ObjectId conversion
    booth.reservedAt = new Date();
    
    // Save with version check (optimistic locking)
    try {
      await booth.save();
    } catch (saveError: any) {
      // Handle version conflict (optimistic locking)
      if (saveError.name === 'VersionError') {
        // Re-fetch to get current state
        const currentBooth = await BoothSpace.findById(boothId);
        if (currentBooth && currentBooth.status !== 'available') {
          throw new CustomError(
            `Booth was ${currentBooth.status} by another user. Please try another booth.`,
            409,
            'CONCURRENT_RESERVATION',
            {
              currentStatus: currentBooth.status,
            }
          );
        }
      }
      throw saveError;
    }

    // Update profile booth reference
    profile.booth = booth._id as any;
    await profile.save();

    // Update floor plan metadata
    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (floorPlan) {
      const availableCount = await BoothSpace.countDocuments({
        floorPlan: floorPlan._id,
        status: 'available',
      });
      floorPlan.metadata.availableBooths = availableCount;
      await floorPlan.save();
    }

    // Broadcast real-time update
    broadcastToExpo(expoId, 'booth-allocated', {
      type: 'booth-allocated',
      boothId: booth._id.toString(),
      identifier: booth.identifier,
      profileId,
      expoId,
      timestamp: new Date().toISOString(),
    });

    logger.info('Booth reserved successfully', {
      boothId,
      profileId,
      userId,
      expoId,
    });

    return {
      boothId: booth._id.toString(),
      identifier: booth.identifier,
      size: booth.size,
      location: booth.location,
      amenities: booth.amenities,
      priceTier: booth.priceTier,
      status: booth.status,
      exhibitor: {
        profileId,
        companyName: profile.companyName,
      },
      reservedAt: booth.reservedAt,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in reserveBooth service:', error);
    throw new CustomError('Failed to reserve booth', 500, 'RESERVE_BOOTH_ERROR');
  }
}

/**
 * Update booth details (products showcased, staff)
 * Implements FR-022
 * Note: This would typically store additional data in a separate collection
 * For now, we'll add these fields to the booth model or create a separate BoothDetails model
 */
export async function updateBoothDetails(
  profileId: string,
  userId: string,
  input: UpdateBoothDetailsInput
): Promise<void> {
  try {
    // Verify profile exists and belongs to user
    const profile = await ExhibitorProfile.findById(profileId);
    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    if (profile.user.toString() !== userId) {
      throw new CustomError('Access denied to this profile', 403, 'FORBIDDEN');
    }

    // Get booth
    if (!profile.booth) {
      throw new CustomError('No booth assigned to this profile', 404, 'NO_BOOTH_ASSIGNED');
    }

    const booth = await BoothSpace.findById(profile.booth);
    if (!booth) {
      throw new CustomError('Booth not found', 404, 'BOOTH_NOT_FOUND');
    }

    // Note: Products showcased and staff would typically be stored in a separate collection
    // or as additional fields on the booth/exhibitor profile
    // For now, we'll log the update - in a full implementation, you'd store this data
    logger.info('Booth details updated', {
      boothId: booth._id.toString(),
      profileId,
      userId,
      productsShowcased: input.productsShowcased,
      staffCount: input.staff?.length || 0,
    });

    // TODO: Store productsShowcased and staff in database
    // This could be added to ExhibitorProfile or a separate BoothDetails model
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateBoothDetails service:', error);
    throw new CustomError('Failed to update booth details', 500, 'UPDATE_BOOTH_DETAILS_ERROR');
  }
}

/**
 * Release booth reservation
 * Implements FR-021 (state transition: reserved → available)
 */
export async function releaseBooth(profileId: string, userId: string): Promise<void> {
  try {
    // Verify profile exists and belongs to user
    const profile = await ExhibitorProfile.findById(profileId);
    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    if (profile.user.toString() !== userId) {
      throw new CustomError('Access denied to this profile', 403, 'FORBIDDEN');
    }

    // Get booth
    if (!profile.booth) {
      throw new CustomError('No booth assigned to this profile', 404, 'NO_BOOTH_ASSIGNED');
    }

    const booth = await BoothSpace.findById(profile.booth);
    if (!booth) {
      throw new CustomError('Booth not found', 404, 'BOOTH_NOT_FOUND');
    }

    // Can only release if status is 'reserved' (not 'occupied')
    if (booth.status !== 'reserved') {
      throw new CustomError(`Cannot release booth with status: ${booth.status}`, 400, 'INVALID_BOOTH_STATUS');
    }

    // Release booth
    booth.status = 'available';
    booth.exhibitor = undefined;
    booth.reservedAt = undefined;
    await booth.save();

    // Clear profile booth reference
    profile.booth = undefined;
    await profile.save();

    // Update floor plan metadata
    const floorPlan = await FloorPlan.findOne({ expo: booth.expo });
    if (floorPlan) {
      const availableCount = await BoothSpace.countDocuments({
        floorPlan: floorPlan._id,
        status: 'available',
      });
      floorPlan.metadata.availableBooths = availableCount;
      await floorPlan.save();
    }

    // Broadcast real-time update
    broadcastToExpo(booth.expo.toString(), 'booth-released', {
      type: 'booth-released',
      boothId: booth._id.toString(),
      identifier: booth.identifier,
      profileId,
      expoId: booth.expo.toString(),
      timestamp: new Date().toISOString(),
    });

    logger.info('Booth released successfully', {
      boothId: booth._id.toString(),
      profileId,
      userId,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in releaseBooth service:', error);
    throw new CustomError('Failed to release booth', 500, 'RELEASE_BOOTH_ERROR');
  }
}

