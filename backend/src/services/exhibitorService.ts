/**
 * Exhibitor Service
 * Implements exhibitor registration and profile management
 * Per contracts/exhibitor-api.yaml: FR-017, FR-018, FR-019
 */

import { ExhibitorProfile, IExhibitorProfile } from '../models/ExhibitorProfile';
import { ExpoEvent } from '../models/ExpoEvent';
import { User } from '../models/User';
import { FloorPlan } from '../models/FloorPlan';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { saveFileInfo, UploadedFileInfo } from './uploadService';

export interface RegisterForExpoInput {
  companyName: string;
  description: string;
  productsServices: string[];
  category: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  logo?: Express.Multer.File;
  documents?: Express.Multer.File[];
}

export interface UpdateProfileInput {
  companyName?: string;
  description?: string;
  productsServices?: string[];
  category?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: Express.Multer.File;
  documents?: Express.Multer.File[];
}

export interface ExhibitorProfileDetail {
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
    uploadedAt: Date;
  }[];
  contactInfo: {
    website?: string;
    email: string;
    phone?: string;
  };
  registrationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  booth?: {
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
    priceTier?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Register exhibitor for expo
 * Implements FR-017
 */
export async function registerForExpo(
  userId: string,
  expoId: string,
  input: RegisterForExpoInput
): Promise<ExhibitorProfileDetail> {
  try {
    // Verify expo exists and is available for registration
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (expo.status !== 'upcoming' && expo.status !== 'active') {
      throw new CustomError('Expo is not accepting registrations', 400, 'EXPO_NOT_ACCEPTING_REGISTRATIONS');
    }

    // Verify user exists and has exhibitor role
    const user = await User.findById(userId);
    if (!user || user.role !== 'exhibitor') {
      throw new CustomError('Only exhibitor users can register', 403, 'FORBIDDEN');
    }

    // Check if already registered
    const existingProfile = await ExhibitorProfile.findOne({ user: userId, expo: expoId });
    if (existingProfile) {
      throw new CustomError('You have already registered for this expo', 409, 'ALREADY_REGISTERED');
    }

    // Process logo upload if provided
    let logoUrl: string | undefined;
    if (input.logo) {
      const logoInfo = saveFileInfo(input.logo);
      logoUrl = logoInfo.url;
    }

    // Process document uploads if provided
    const documentInfos: { filename: string; url: string; uploadedAt: Date }[] = [];
    if (input.documents && input.documents.length > 0) {
      for (const doc of input.documents) {
        const docInfo = saveFileInfo(doc);
        documentInfos.push({
          filename: docInfo.originalName,
          url: docInfo.url,
          uploadedAt: new Date(),
        });
      }
    }

    // Create exhibitor profile
    const profile = new ExhibitorProfile({
      user: userId,
      expo: expoId,
      companyName: input.companyName,
      description: input.description,
      logo: logoUrl,
      productsServices: input.productsServices,
      category: input.category,
      documents: documentInfos,
      contactInfo: {
        email: input.contactEmail,
        phone: input.contactPhone,
        website: input.website,
      },
      registrationStatus: 'pending',
    });

    await profile.save();

    logger.info('Exhibitor registered for expo', {
      profileId: profile._id.toString(),
      userId,
      expoId,
      companyName: input.companyName,
    });

    return formatExhibitorProfileDetail(profile);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in registerForExpo service:', error);
    throw new CustomError('Failed to register for expo', 500, 'REGISTRATION_ERROR');
  }
}

/**
 * Get all exhibitor profiles for a user
 * Implements FR-019
 */
export async function getProfiles(userId: string): Promise<ExhibitorProfileDetail[]> {
  try {
    const profiles = await ExhibitorProfile.find({ user: userId })
      .populate('expo', 'title status')
      .populate('booth', 'identifier size location amenities priceTier')
      .sort({ createdAt: -1 });

    return profiles.map(formatExhibitorProfileDetail);
  } catch (error) {
    logger.error('Error in getProfiles service:', error);
    throw new CustomError('Failed to retrieve exhibitor profiles', 500, 'GET_PROFILES_ERROR');
  }
}

/**
 * Get single exhibitor profile
 * Implements FR-019
 */
export async function getProfile(profileId: string, userId: string): Promise<ExhibitorProfileDetail> {
  try {
    const profile = await ExhibitorProfile.findById(profileId)
      .populate('expo', 'title status')
      .populate('booth', 'identifier size location amenities priceTier');

    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // RBAC: Only the profile owner can view their profile
    if (profile.user.toString() !== userId) {
      throw new CustomError('Access denied to this profile', 403, 'FORBIDDEN');
    }

    return formatExhibitorProfileDetail(profile);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getProfile service:', error);
    throw new CustomError('Failed to retrieve exhibitor profile', 500, 'GET_PROFILE_ERROR');
  }
}

/**
 * Update exhibitor profile
 * Implements FR-019
 */
export async function updateProfile(
  profileId: string,
  userId: string,
  input: UpdateProfileInput
): Promise<ExhibitorProfileDetail> {
  try {
    const profile = await ExhibitorProfile.findById(profileId);

    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // RBAC: Only the profile owner can update their profile
    if (profile.user.toString() !== userId) {
      throw new CustomError('Access denied to this profile', 403, 'FORBIDDEN');
    }

    // Prevent updates if profile is approved (locked)
    if (profile.registrationStatus === 'approved') {
      throw new CustomError('Cannot update approved profile. Contact organizer for changes.', 400, 'PROFILE_LOCKED');
    }

    // Update fields
    if (input.companyName !== undefined) profile.companyName = input.companyName;
    if (input.description !== undefined) profile.description = input.description;
    if (input.productsServices !== undefined) profile.productsServices = input.productsServices;
    if (input.category !== undefined) profile.category = input.category;
    if (input.contactEmail !== undefined) profile.contactInfo.email = input.contactEmail;
    if (input.contactPhone !== undefined) profile.contactInfo.phone = input.contactPhone;
    if (input.website !== undefined) profile.contactInfo.website = input.website;

    // Handle logo update
    if (input.logo) {
      const logoInfo = saveFileInfo(input.logo);
      profile.logo = logoInfo.url;
    }

    // Handle document additions
    if (input.documents && input.documents.length > 0) {
      const newDocs = input.documents.map((doc) => {
        const docInfo = saveFileInfo(doc);
        return {
          filename: docInfo.originalName,
          url: docInfo.url,
          uploadedAt: new Date(),
        };
      });
      profile.documents.push(...newDocs);
    }

    await profile.save();

    logger.info('Exhibitor profile updated', {
      profileId: profile._id.toString(),
      userId,
    });

    return formatExhibitorProfileDetail(
      await ExhibitorProfile.findById(profileId)
        .populate('expo', 'title status')
        .populate('booth', 'identifier size location amenities priceTier')
    );
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateProfile service:', error);
    throw new CustomError('Failed to update exhibitor profile', 500, 'UPDATE_PROFILE_ERROR');
  }
}

/**
 * Assign booth to exhibitor profile (called by organizer)
 * Implements FR-011
 */
export async function assignBooth(profileId: string, boothId: string): Promise<void> {
  try {
    const profile = await ExhibitorProfile.findById(profileId);
    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    if (profile.registrationStatus !== 'approved') {
      throw new CustomError('Can only assign booth to approved exhibitors', 400, 'PROFILE_NOT_APPROVED');
    }

    profile.booth = boothId as any;
    await profile.save();

    logger.info('Booth assigned to exhibitor profile', {
      profileId,
      boothId,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in assignBooth service:', error);
    throw new CustomError('Failed to assign booth', 500, 'ASSIGN_BOOTH_ERROR');
  }
}

/**
 * Get floor plan for expo
 * Implements FR-012
 */
export async function getFloorPlan(expoId: string, userId: string): Promise<any> {
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

    logger.info('Floor plan retrieved', { expoId, userId });

    return {
      floorPlanId: floorPlan._id.toString(),
      expoId,
      name: floorPlan.name,
      dimensions: floorPlan.dimensions,
      imageUrl: floorPlan.imageUrl,
      metadata: floorPlan.metadata,
      createdAt: floorPlan.createdAt,
      updatedAt: floorPlan.updatedAt,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getFloorPlan service:', error);
    throw new CustomError('Failed to retrieve floor plan', 500, 'GET_FLOOR_PLAN_ERROR');
  }
}

/**
 * Format exhibitor profile for API response
 */
function formatExhibitorProfileDetail(profile: any): ExhibitorProfileDetail {
  const expo = profile.expo as any;
  const booth = profile.booth as any;

  return {
    profileId: profile._id.toString(),
    expoId: expo?._id?.toString() || profile.expo.toString(),
    expoTitle: expo?.title || '',
    companyName: profile.companyName,
    description: profile.description,
    logo: profile.logo,
    productsServices: profile.productsServices,
    category: profile.category,
    documents: profile.documents || [],
    contactInfo: profile.contactInfo,
    registrationStatus: profile.registrationStatus,
    rejectionReason: profile.rejectionReason,
    booth: booth
      ? {
          boothId: booth._id.toString(),
          identifier: booth.identifier,
          size: booth.size,
          location: booth.location,
          amenities: booth.amenities,
          priceTier: booth.priceTier,
        }
      : undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

