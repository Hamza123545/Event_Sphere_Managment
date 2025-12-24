/**
 * Exhibitor Approval Service
 * Handles exhibitor application approval and rejection workflow
 * Implements FR-011, T145, T148, T152
 */

import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { ExpoEvent } from '../models/ExpoEvent';
import { User } from '../models/User';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { broadcastToExhibitor } from './realtime';
import * as emailService from './emailService';

export interface ExhibitorApplication {
  profileId: string;
  userId: string;
  expoId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List pending exhibitor applications for an expo
 * Implements T145
 */
export async function listPendingApplications(
  expoId: string,
  userId: string,
  userRole: string,
  options?: {
    status?: 'pending' | 'approved' | 'rejected';
  }
): Promise<ExhibitorApplication[]> {
  try {
    // RBAC: Only organizer who created expo or admin can view applications
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can view applications', 403, 'FORBIDDEN');
    }

    // Build query
    const query: any = { expo: expoId };
    if (options?.status) {
      query.registrationStatus = options.status;
    } else {
      // Default to all statuses if not specified
    }

    const profiles = await ExhibitorProfile.find(query)
      .populate('user', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    return profiles.map((profile: any) => formatApplication(profile));
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in listPendingApplications service:', error);
    throw new CustomError('Failed to list applications', 500, 'LIST_APPLICATIONS_ERROR');
  }
}

/**
 * Approve exhibitor application
 * Implements T145, T148
 */
export async function approveExhibitor(
  expoId: string,
  exhibitorId: string,
  userId: string,
  userRole: string
): Promise<ExhibitorApplication> {
  try {
    // RBAC: Only organizer who created expo or admin can approve
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can approve applications', 403, 'FORBIDDEN');
    }

    // Get exhibitor profile
    const profile = await ExhibitorProfile.findOne({
      _id: exhibitorId,
      expo: expoId,
    }).populate('user');

    if (!profile) {
      throw new CustomError('Exhibitor application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    // Verify status is pending
    if (profile.registrationStatus !== 'pending') {
      throw new CustomError(
        `Cannot approve application with status: ${profile.registrationStatus}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Update status to approved (T148)
    profile.registrationStatus = 'approved';
    profile.rejectionReason = undefined; // Clear any previous rejection reason
    await profile.save();

    // Get user for notification
    const exhibitorUser = await User.findById(profile.user);
    if (!exhibitorUser) {
      throw new CustomError('Exhibitor user not found', 404, 'USER_NOT_FOUND');
    }

    // Send approval email (T147)
    try {
      await emailService.sendApprovalEmail({
        exhibitorEmail: profile.contactInfo.email,
        exhibitorName: profile.companyName,
        expoTitle: expo.title,
        expoId: expo._id.toString(),
      });
    } catch (emailError) {
      logger.warn('Failed to send approval email', { error: emailError });
      // Don't fail the approval if email fails
    }

    // Broadcast real-time event (T149) - to exhibitor-{userId} room
    broadcastToExhibitor(profile.user.toString(), 'exhibitor-approved', {
      type: 'exhibitor-approved',
      profileId: profile._id.toString(),
      exhibitorProfileId: profile._id.toString(), // Contract requires this field name
      expoId: expoId,
      expoTitle: expo.title,
      timestamp: new Date().toISOString(),
    });

    // Audit logging (T152)
    logger.info('Exhibitor application approved', {
      action: 'approve_exhibitor',
      expoId,
      exhibitorId,
      profileId: profile._id.toString(),
      companyName: profile.companyName,
      approvedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return formatApplication(profile);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in approveExhibitor service:', error);
    throw new CustomError('Failed to approve exhibitor', 500, 'APPROVE_EXHIBITOR_ERROR');
  }
}

/**
 * Reject exhibitor application
 * Implements T145, T148
 */
export async function rejectExhibitor(
  expoId: string,
  exhibitorId: string,
  userId: string,
  userRole: string,
  reason: string
): Promise<ExhibitorApplication> {
  try {
    // RBAC: Only organizer who created expo or admin can reject
    const expo = await ExpoEvent.findById(expoId);
    if (!expo) {
      throw new CustomError('Expo not found', 404, 'EXPO_NOT_FOUND');
    }

    if (userRole !== 'admin' && expo.organizer.toString() !== userId) {
      throw new CustomError('Only the organizer who created this expo can reject applications', 403, 'FORBIDDEN');
    }

    // Validate rejection reason
    if (!reason || reason.trim().length < 10 || reason.trim().length > 500) {
      throw new CustomError('Rejection reason must be between 10 and 500 characters', 400, 'VALIDATION_ERROR');
    }

    // Get exhibitor profile
    const profile = await ExhibitorProfile.findOne({
      _id: exhibitorId,
      expo: expoId,
    }).populate('user');

    if (!profile) {
      throw new CustomError('Exhibitor application not found', 404, 'APPLICATION_NOT_FOUND');
    }

    // Verify status is pending
    if (profile.registrationStatus !== 'pending') {
      throw new CustomError(
        `Cannot reject application with status: ${profile.registrationStatus}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Update status to rejected (T148)
    profile.registrationStatus = 'rejected';
    profile.rejectionReason = reason.trim();
    await profile.save();

    // Send rejection email (T147)
    try {
      await emailService.sendRejectionEmail({
        exhibitorEmail: profile.contactInfo.email,
        exhibitorName: profile.companyName,
        expoTitle: expo.title,
        rejectionReason: reason.trim(),
      });
    } catch (emailError) {
      logger.warn('Failed to send rejection email', { error: emailError });
      // Don't fail the rejection if email fails
    }

    // Broadcast real-time event (T150) - to exhibitor-{userId} room
    broadcastToExhibitor(profile.user.toString(), 'exhibitor-rejected', {
      type: 'exhibitor-rejected',
      profileId: profile._id.toString(),
      exhibitorProfileId: profile._id.toString(), // Contract requires this field name
      expoId: expoId,
      expoTitle: expo.title,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    });

    // Audit logging (T152)
    logger.info('Exhibitor application rejected', {
      action: 'reject_exhibitor',
      expoId,
      exhibitorId,
      profileId: profile._id.toString(),
      companyName: profile.companyName,
      rejectionReason: reason.trim(),
      rejectedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return formatApplication(profile);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in rejectExhibitor service:', error);
    throw new CustomError('Failed to reject exhibitor', 500, 'REJECT_EXHIBITOR_ERROR');
  }
}

/**
 * Format exhibitor profile as application response
 */
function formatApplication(profile: any): ExhibitorApplication {
  return {
    profileId: profile._id.toString(),
    userId: profile.user._id ? profile.user._id.toString() : profile.user.toString(),
    expoId: profile.expo.toString(),
    companyName: profile.companyName,
    description: profile.description,
    logo: profile.logo,
    productsServices: profile.productsServices,
    category: profile.category,
    documents: profile.documents || [],
    contactInfo: profile.contactInfo,
    registrationStatus: profile.registrationStatus,
    rejectionReason: profile.rejectionReason,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

