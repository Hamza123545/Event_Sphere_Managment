import { ExpoEvent, IExpoEvent } from '../models/ExpoEvent';
import { User } from '../models/User';
import { AppError as CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToExpo } from './realtime';
import cacheService, { CacheKeys } from './cacheService';

export interface CreateExpoInput {
  title: string;
  description: string;
  theme?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  imageUrl?: string;
}

export interface UpdateExpoInput {
  title?: string;
  description?: string;
  theme?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  location?: {
    venueName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  status?: 'draft' | 'upcoming' | 'active' | 'cancelled';
  imageUrl?: string;
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
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpoSummary {
  expoId: string;
  title: string;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    venueName: string;
    city: string;
    country: string;
  };
  imageUrl?: string;
}

/**
 * Fix image URL - replace localhost with production URL if needed
 * This ensures old images with localhost URLs work in production
 */
function fixImageUrl(url: string | undefined): string | undefined {
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
      logger.debug('Fixed image URL', { original: url, fixed: fixedUrl });
      return fixedUrl;
    } catch (error) {
      // If URL parsing fails, try simple string replacement
      const fixedUrl = url.replace(/http:\/\/localhost:\d+/, productionUrl);
      logger.debug('Fixed image URL (fallback)', { original: url, fixed: fixedUrl });
      return fixedUrl;
    }
  }
  
  return url;
}

/**
 * Create a new expo event
 * Implements FR-008
 */
export async function createExpo(userId: string, input: CreateExpoInput): Promise<ExpoDetail> {
  try {
    // Verify user is organizer or admin
    const user = await User.findById(userId);
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      throw new CustomError('Only organizers can create expos', 403, 'FORBIDDEN');
    }

    // Validate dates
    const startDate = new Date(input.dateRange.startDate);
    const endDate = new Date(input.dateRange.endDate);

    // For draft expos, we allow dates in the past (flexibility for editing)
    // But we still validate that end date is after start date
    if (endDate <= startDate) {
      throw new CustomError('End date must be after start date', 400, 'VALIDATION_ERROR');
    }

    // Create expo
    const expo = new ExpoEvent({
      title: input.title,
      description: input.description,
      theme: input.theme,
      dateRange: {
        startDate,
        endDate,
      },
      location: input.location,
      organizer: userId,
      status: 'draft', // Initial status is draft
      imageUrl: input.imageUrl,
    });

    await expo.save();

    // Invalidate cache for organizer's expo list
    const cacheKey = CacheKeys.expoList(userId);
    await cacheService.delete(cacheKey);
    logger.debug('Invalidated expo list cache after create', { userId, cacheKey });

    // Populate organizer info
    await expo.populate('organizer', 'profile.firstName profile.lastName');

    // Audit logging per FR-006, FR-048
    logger.info('Expo created successfully', {
      action: 'create_expo',
      expoId: expo._id.toString(),
      title: expo.title,
      organizerId: userId,
      timestamp: new Date().toISOString(),
    });

    return formatExpoDetail(expo);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in createExpo service:', error);
    throw new CustomError('Failed to create expo', 500, 'CREATE_EXPO_ERROR');
  }
}

/**
 * Get expo by ID with RBAC check
 * Implements FR-008
 */
export async function getExpoById(expoId: string, userId: string, userRole: string): Promise<ExpoDetail> {
  try {
    const expo = await ExpoEvent.findById(expoId).populate('organizer', 'profile.firstName profile.lastName');
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // RBAC: Only organizer who created expo or admin can view/edit
    // For now, we'll allow viewing. In future, we might want to allow exhibitors/attendees to view public expos
    // Handle both populated (User document) and unpopulated (ObjectId) organizer
    let organizerId: string;
    if (expo.organizer && typeof expo.organizer === 'object' && '_id' in expo.organizer) {
      // Organizer is populated (User document)
      organizerId = (expo.organizer as any)._id.toString();
    } else {
      // Organizer is not populated (ObjectId)
      organizerId = expo.organizer?.toString ? expo.organizer.toString() : String(expo.organizer);
    }
    if (userRole !== 'admin' && organizerId !== userId) {
      logger.warn('Access denied to expo', { userId, organizerId, userRole, expoId });
      throw new CustomError('Access denied to this expo', 403, 'FORBIDDEN');
    }

    return formatExpoDetail(expo);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getExpoById service:', error);
    throw new CustomError('Failed to get expo', 500, 'GET_EXPO_ERROR');
  }
}

/**
 * List all expos for an organizer
 * Implements FR-008
 */
export async function listOrganizerExpos(
  userId: string,
  options: {
    status?: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ expos: ExpoSummary[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }> {
  try {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Try to get from cache (T238) - only for first page without status filter
    if (page === 1 && !options.status) {
      const cacheKey = CacheKeys.expoList(userId);
      const cached = await cacheService.get<{ expos: ExpoSummary[]; pagination: any }>(cacheKey);
      if (cached) {
        // Fix image URLs in cached data as well
        cached.expos = cached.expos.map(expo => ({
          ...expo,
          imageUrl: fixImageUrl(expo.imageUrl),
        }));
        logger.debug('Returning cached expo list (with fixed URLs)', { userId, cacheKey });
        return cached;
      }
    }

    // Build query
    const query: any = { organizer: userId };
    if (options.status) {
      query.status = options.status;
    }

    // Get total count for pagination
    const totalItems = await ExpoEvent.countDocuments(query);

    // Get expos
    const expos = await ExpoEvent.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const expoSummaries: ExpoSummary[] = expos.map((expo: IExpoEvent) => ({
      expoId: (expo as any)._id.toString(),
      title: expo.title,
      status: expo.status,
      dateRange: {
        startDate: expo.dateRange.startDate,
        endDate: expo.dateRange.endDate,
      },
      location: {
        venueName: expo.location.venueName,
        city: expo.location.city,
        country: expo.location.country,
      },
      imageUrl: fixImageUrl(expo.imageUrl),
    }));

    const totalPages = Math.ceil(totalItems / limit);

    logger.info('Listed expos for organizer', { organizerId: userId, count: expoSummaries.length });

    const result = {
      expos: expoSummaries,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };

    // Cache result for first page without status filter (T238)
    if (page === 1 && !options.status) {
      const cacheKey = CacheKeys.expoList(userId);
      await cacheService.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    logger.error('Error in listOrganizerExpos service:', error);
    throw new CustomError('Failed to list expos', 500, 'LIST_EXPOS_ERROR');
  }
}

/**
 * Update expo event
 * Implements FR-009
 */
export async function updateExpo(
  expoId: string,
  userId: string,
  userRole: string,
  updates: UpdateExpoInput
): Promise<ExpoDetail> {
  try {
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // RBAC: Only organizer who created expo or admin can update
    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can update it', 403, 'FORBIDDEN');
    }

    // Store original values for change detection
    const originalExpo = {
      title: expo.title,
      description: expo.description,
      theme: expo.theme,
      dateRange: { ...expo.dateRange },
      location: { ...expo.location },
      status: expo.status,
    };

    // Detect changes for audit logging and WebSocket broadcast (before applying updates)
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    if (updates.title && updates.title !== originalExpo.title) {
      changes.push({ field: 'title', oldValue: originalExpo.title, newValue: updates.title });
    }
    if (updates.description && updates.description !== originalExpo.description) {
      changes.push({ field: 'description', oldValue: originalExpo.description, newValue: updates.description });
    }
    if (updates.theme !== undefined && updates.theme !== originalExpo.theme) {
      changes.push({ field: 'theme', oldValue: originalExpo.theme, newValue: updates.theme });
    }
    if (updates.dateRange) {
      const startDate = new Date(updates.dateRange.startDate);
      const endDate = new Date(updates.dateRange.endDate);
      if (startDate.getTime() !== originalExpo.dateRange.startDate.getTime() || 
          endDate.getTime() !== originalExpo.dateRange.endDate.getTime()) {
        changes.push({
          field: 'dateRange',
          oldValue: originalExpo.dateRange,
          newValue: updates.dateRange,
        });
      }
    }
    if (updates.location) {
      const locationChanged = 
        (updates.location.venueName && updates.location.venueName !== originalExpo.location.venueName) ||
        (updates.location.address && updates.location.address !== originalExpo.location.address) ||
        (updates.location.city && updates.location.city !== originalExpo.location.city) ||
        (updates.location.country && updates.location.country !== originalExpo.location.country) ||
        (updates.location.state !== undefined && updates.location.state !== originalExpo.location.state) ||
        (updates.location.zipCode !== undefined && updates.location.zipCode !== originalExpo.location.zipCode);
      
      if (locationChanged) {
        changes.push({
          field: 'location',
          oldValue: originalExpo.location,
          newValue: updates.location,
        });
      }
    }
    if (updates.status && updates.status !== originalExpo.status) {
      // Completed status cannot be set manually (auto-transitioned)
      changes.push({ field: 'status', oldValue: originalExpo.status, newValue: updates.status });
    }

    // Apply updates
    if (updates.title) expo.title = updates.title;
    if (updates.description) expo.description = updates.description;
    if (updates.theme !== undefined) expo.theme = updates.theme;
    if (updates.dateRange) {
      // Validate date range
      const startDate = new Date(updates.dateRange.startDate);
      const endDate = new Date(updates.dateRange.endDate);
      if (endDate <= startDate) {
        throw new CustomError('End date must be after start date', 400, 'VALIDATION_ERROR');
      }
      expo.dateRange = {
        startDate,
        endDate,
      };
    }
    if (updates.location) {
      if (updates.location.venueName) expo.location.venueName = updates.location.venueName;
      if (updates.location.address) expo.location.address = updates.location.address;
      if (updates.location.city) expo.location.city = updates.location.city;
      if (updates.location.state !== undefined) expo.location.state = updates.location.state;
      if (updates.location.country) expo.location.country = updates.location.country;
      if (updates.location.zipCode !== undefined) expo.location.zipCode = updates.location.zipCode;
    }
    if (updates.status) {
      // Completed status cannot be set manually (auto-transitioned) - prevented by type system
      expo.status = updates.status;
    }
    if (updates.imageUrl !== undefined) {
      expo.imageUrl = updates.imageUrl || undefined; // Convert null to undefined to remove field
    }

    await expo.save();

    // Invalidate cache for organizer's expo list
    const cacheKey = CacheKeys.expoList(userId);
    await cacheService.delete(cacheKey);
    logger.debug('Invalidated expo list cache after update', { userId, cacheKey });

    // Populate organizer info
    await expo.populate('organizer', 'profile.firstName profile.lastName');

    // Audit logging per FR-006, FR-048
    logger.info('Expo updated successfully', {
      action: 'update_expo',
      expoId: expo._id.toString(),
      title: expo.title,
      updatedBy: userId,
      changes: changes.map((c) => c.field),
      timestamp: new Date().toISOString(),
    });

    // Broadcast expo-updated event to all users in expo room (FR-036)
    if (changes.length > 0) {
      broadcastToExpo(expo._id.toString(), 'expo-updated', {
        type: 'expo-updated',
        expoId: expo._id.toString(),
        changes: changes.map((c) => ({
          field: c.field as 'dateRange' | 'location' | 'title' | 'description' | 'theme' | 'status',
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
        expo: {
          title: expo.title,
          dateRange: {
            startDate: expo.dateRange.startDate.toISOString(),
            endDate: expo.dateRange.endDate.toISOString(),
          },
          location: {
            venueName: expo.location.venueName,
            city: expo.location.city,
            country: expo.location.country,
          },
          theme: expo.theme,
          status: expo.status,
          imageUrl: fixImageUrl(expo.imageUrl),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return formatExpoDetail(expo);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateExpo service:', error);
    throw new CustomError('Failed to update expo', 500, 'UPDATE_EXPO_ERROR');
  }
}

/**
 * Delete expo event
 * Implements FR-009
 */
export async function deleteExpo(expoId: string, userId: string, userRole: string): Promise<void> {
  try {
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    // RBAC: Only organizer who created expo or admin can delete
    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can delete it', 403, 'FORBIDDEN');
    }

    // TODO: Check for active exhibitor registrations (prevent deletion if active registrations exist)
    // For now, we'll allow deletion. This check should be added when exhibitor registration is implemented.

    const organizerId = expo.organizer.toString();
    await ExpoEvent.findByIdAndDelete(expoId);

    // Invalidate cache for organizer's expo list
    const cacheKey = CacheKeys.expoList(organizerId);
    await cacheService.delete(cacheKey);
    logger.debug('Invalidated expo list cache after delete', { organizerId, cacheKey });

    // Audit logging per FR-006, FR-048
    logger.info('Expo deleted successfully', {
      action: 'delete_expo',
      expoId,
      title: expo.title,
      deletedBy: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in deleteExpo service:', error);
    throw new CustomError('Failed to delete expo', 500, 'DELETE_EXPO_ERROR');
  }
}

/**
 * Format expo document to ExpoDetail interface
 */
function formatExpoDetail(expo: IExpoEvent & { organizer?: any }): ExpoDetail {
  const organizerInfo = expo.organizer as any;
  const organizerName = organizerInfo?.profile
    ? `${organizerInfo.profile.firstName} ${organizerInfo.profile.lastName}`
    : 'Unknown';

  return {
    expoId: (expo as any)._id.toString(),
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
      state: expo.location.state,
      country: expo.location.country,
      zipCode: expo.location.zipCode,
    },
    organizer: {
      userId: typeof expo.organizer === 'object' ? expo.organizer._id.toString() : expo.organizer.toString(),
      name: organizerName,
    },
    status: expo.status,
    imageUrl: fixImageUrl(expo.imageUrl),
    createdAt: expo.createdAt,
    updatedAt: expo.updatedAt,
  };
}

