/**
 * Attendee Service
 * Implements attendee browsing, registration, and exhibitor search
 * Per contracts/attendee-api.yaml: FR-014, FR-023, FR-024
 */

import { ExpoEvent } from '../models/ExpoEvent';
import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { AttendeeRegistration } from '../models/AttendeeRegistration';
import { FloorPlan } from '../models/FloorPlan';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export interface ExpoListing {
  expoId: string;
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    city: string;
    country: string;
  };
  status: 'upcoming' | 'active';
}

export interface ExpoDetail {
  expoId: string;
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    address?: string;
    city: string;
    country: string;
  };
  status: string;
  registrationStatus?: 'registered' | 'not-registered';
}

export interface ExhibitorSearchResult {
  profileId: string;
  companyName: string;
  description: string;
  logo?: string;
  productsServices: string[];
  category: string;
  booth?: {
    boothId: string;
    identifier: string;
    location: {
      x: number;
      y: number;
    };
  };
}

export interface RegisterForExpoInput {
  preferences?: {
    interests?: string[];
    dietaryRestrictions?: string[];
  };
}

/**
 * Browse available expos for attendees with pagination
 * Implements FR-023, T237
 */
export async function browseExpos(options?: {
  status?: 'upcoming' | 'active';
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{
  expos: ExpoListing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}> {
  try {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100); // Max 100 items per page, default 20
    const skip = (page - 1) * limit;

    const query: any = {
      status: { $in: ['upcoming', 'active'] },
    };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.category) {
      query.theme = { $regex: options.category, $options: 'i' };
    }

    if (options?.location) {
      query.$or = [
        { 'location.city': { $regex: options.location, $options: 'i' } },
        { 'location.country': { $regex: options.location, $options: 'i' } },
      ];
    }

    if (options?.dateFrom || options?.dateTo) {
      query['dateRange.startDate'] = {};
      if (options.dateFrom) {
        query['dateRange.startDate'].$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        query['dateRange.startDate'].$lte = new Date(options.dateTo);
      }
    }

    // Debug logging to help troubleshoot
    logger.debug('browseExpos query', { query: JSON.stringify(query), options });

    // Get total count for pagination
    const totalItems = await ExpoEvent.countDocuments(query);

    const expos = await ExpoEvent.find(query)
      .select('title description theme dateRange location status imageUrl')
      .sort({ 'dateRange.startDate': 1 })
      .skip(skip)
      .limit(limit);
    
    // Debug logging - log found expos
    logger.debug('browseExpos found expos', { 
      count: expos.length, 
      totalItems,
      expos: expos.map((e: any) => ({ 
        id: e._id.toString(), 
        title: e.title, 
        status: e.status 
      })) 
    });

    const totalPages = Math.ceil(totalItems / limit);

    // Helper function to fix image URLs (same as in expoService)
    const fixImageUrl = (url: string | undefined): string | undefined => {
      if (!url) return undefined;
      
      // Replace localhost URLs with production URL
      if (url.includes('localhost:5000') || url.includes('localhost:7860')) {
        const productionUrl = process.env.BASE_URL || 
          (process.env.NODE_ENV === 'production' 
            ? 'https://hamza057-eventsphere-backend.hf.space'
            : 'http://localhost:5000');
        
        // Extract the path from the old URL
        try {
          const urlObj = new URL(url);
          const path = urlObj.pathname;
          
          // Construct new URL with production base
          const fixedUrl = `${productionUrl}${path}`;
          logger.debug('Fixed image URL in browseExpos', { original: url, fixed: fixedUrl });
          return fixedUrl;
        } catch (error) {
          // If URL parsing fails, try simple string replacement
          const fixedUrl = url.replace(/http:\/\/localhost:\d+/, productionUrl);
          logger.debug('Fixed image URL in browseExpos (fallback)', { original: url, fixed: fixedUrl });
          return fixedUrl;
        }
      }
      
      return url;
    };
    
    return {
      expos: expos.map((expo: any) => ({
        expoId: expo._id.toString(),
        title: expo.title,
        description: expo.description,
        theme: expo.theme,
        dateRange: {
          startDate: expo.dateRange.startDate,
          endDate: expo.dateRange.endDate,
        },
        location: {
          venueName: expo.location.venueName,
          city: expo.location.city,
          country: expo.location.country,
        },
        status: expo.status as 'upcoming' | 'active',
        imageUrl: fixImageUrl(expo.imageUrl),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    logger.error('Error in browseExpos service:', error);
    throw new CustomError('Failed to browse expos', 500, 'BROWSE_EXPOS_ERROR');
  }
}

/**
 * Get expo details with registration status
 * Implements FR-023
 */
export async function getExpoDetails(expoId: string, userId: string): Promise<ExpoDetail> {
  try {
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Check if user is registered
    const registration = await AttendeeRegistration.findOne({ user: userId, expo: expoId });

    return {
      expoId: expo._id.toString(),
      title: expo.title,
      description: expo.description,
      theme: expo.theme,
      dateRange: {
        startDate: expo.dateRange.startDate,
        endDate: expo.dateRange.endDate,
      },
      location: {
        venueName: expo.location.venueName,
        address: expo.location.address,
        city: expo.location.city,
        country: expo.location.country,
      },
      status: expo.status,
      registrationStatus: registration ? 'registered' : 'not-registered',
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getExpoDetails service:', error);
    throw new CustomError('Failed to get expo details', 500, 'GET_EXPO_DETAILS_ERROR');
  }
}

/**
 * Register attendee for expo
 * Implements FR-014
 */
export async function registerForExpo(
  expoId: string,
  userId: string,
  input: RegisterForExpoInput
): Promise<void> {
  try {
    // Verify expo exists and is available
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (expo.status !== 'upcoming' && expo.status !== 'active') {
      throw new CustomError('Expo is not accepting registrations', 400, 'EXPO_NOT_ACCEPTING_REGISTRATIONS');
    }

    // Check if already registered
    const existingRegistration = await AttendeeRegistration.findOne({ user: userId, expo: expoId });
    if (existingRegistration) {
      throw new CustomError('Already registered for this expo', 409, 'ALREADY_REGISTERED');
    }

    // Create registration
    const registration = new AttendeeRegistration({
      user: userId,
      expo: expoId,
      preferences: {
        interests: input.preferences?.interests || [],
        dietaryRestrictions: input.preferences?.dietaryRestrictions || [],
      },
    });

    await registration.save();

    logger.info('Attendee registered for expo', {
      userId,
      expoId,
      registrationId: registration._id.toString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in registerForExpo service:', error);
    throw new CustomError('Failed to register for expo', 500, 'REGISTER_FOR_EXPO_ERROR');
  }
}

/**
 * Search exhibitors by category, product keyword, or company name
 * Implements FR-024 (with text indexes)
 */
export async function searchExhibitors(
  expoId: string,
  options?: {
    category?: string;
    productKeyword?: string;
    companyName?: string;
  }
): Promise<ExhibitorSearchResult[]> {
  try {
    // Verify expo exists
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    const query: any = {
      expo: expoId,
      registrationStatus: 'approved', // Only show approved exhibitors
    };

    // Category filter
    if (options?.category) {
      query.category = { $regex: options.category, $options: 'i' };
    }

    // Company name search
    if (options?.companyName) {
      query.companyName = { $regex: options.companyName, $options: 'i' };
    }

    // Product/service keyword search
    let exhibitors = await ExhibitorProfile.find(query)
      .populate('booth', 'identifier location')
      .select('companyName description logo productsServices category booth')
      .limit(100);

    // Filter by product keyword if provided (client-side filtering for now)
    // In production, you'd use MongoDB text indexes
    if (options?.productKeyword) {
      const keyword = options.productKeyword.toLowerCase();
      exhibitors = exhibitors.filter((exhibitor) => {
        return exhibitor.productsServices.some((product) =>
          product.toLowerCase().includes(keyword)
        );
      });
    }

    return exhibitors.map((exhibitor: any) => {
      const booth = exhibitor.booth as any;
      return {
        profileId: exhibitor._id.toString(),
        companyName: exhibitor.companyName,
        description: exhibitor.description,
        logo: exhibitor.logo,
        productsServices: exhibitor.productsServices,
        category: exhibitor.category,
        booth: booth
          ? {
              boothId: booth._id.toString(),
              identifier: booth.identifier,
              location: booth.location,
            }
          : undefined,
      };
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in searchExhibitors service:', error);
    throw new CustomError('Failed to search exhibitors', 500, 'SEARCH_EXHIBITORS_ERROR');
  }
}

/**
 * Get exhibitor profile for attendees
 * Implements FR-024
 */
export async function getExhibitorProfile(
  expoId: string,
  profileId: string
): Promise<ExhibitorSearchResult> {
  try {
    const profile = await ExhibitorProfile.findById(profileId)
      .populate('booth', 'identifier location')
      .select('companyName description logo productsServices category booth expo registrationStatus');

    if (!profile) {
      throw new CustomError('Exhibitor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    // Verify profile belongs to this expo
    if (profile.expo && profile.expo.toString() !== expoId) {
      throw new CustomError('Exhibitor profile does not belong to this expo', 400, 'INVALID_PROFILE');
    }

    // Only show approved exhibitors
    if (profile.registrationStatus !== 'approved') {
      throw new CustomError('Exhibitor profile not available', 404, 'PROFILE_NOT_AVAILABLE');
    }

    const booth = profile.booth as any;

    return {
      profileId: profile._id.toString(),
      companyName: profile.companyName,
      description: profile.description,
      logo: profile.logo,
      productsServices: profile.productsServices,
      category: profile.category,
      booth: booth
        ? {
            boothId: booth._id.toString(),
            identifier: booth.identifier,
            location: booth.location,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getExhibitorProfile service:', error);
    throw new CustomError('Failed to get exhibitor profile', 500, 'GET_EXHIBITOR_PROFILE_ERROR');
  }
}

/**
 * View floor plan for expo (read-only for attendees)
 * Implements FR-012
 */
export async function viewFloorPlan(expoId: string): Promise<any> {
  try {
    // Verify expo exists
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // Get floor plan
    const floorPlan = await FloorPlan.findOne({ expo: expoId });
    if (!floorPlan) {
      // Floor plan not found is a normal condition (not created yet), log as debug
      logger.debug('Floor plan not found for expo (normal condition)', { expoId });
      throw new CustomError('Floor plan not found for this expo', 404, 'FLOOR_PLAN_NOT_FOUND');
    }

    logger.info('Floor plan viewed by attendee', { expoId });

    return {
      floorPlanId: floorPlan._id.toString(),
      expoId,
      name: floorPlan.name,
      dimensions: floorPlan.dimensions,
      imageUrl: floorPlan.imageUrl,
      metadata: floorPlan.metadata,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in viewFloorPlan service:', error);
    throw new CustomError('Failed to retrieve floor plan', 500, 'VIEW_FLOOR_PLAN_ERROR');
  }
}

