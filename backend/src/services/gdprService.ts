/**
 * GDPR Service
 * Handles data export and deletion per FR-007
 * Implements T231, T232
 */

import { User } from '../models/User';
import { ExpoEvent } from '../models/ExpoEvent';
import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { AttendeeRegistration } from '../models/AttendeeRegistration';
import { SessionBookmark } from '../models/SessionBookmark';
import { Message } from '../models/Message';
import { FeedbackSubmission } from '../models/FeedbackSubmission';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export interface UserDataExport {
  userId: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  isEmailVerified: boolean;
  gdprConsent: {
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate: Date;
  };
  createdAt: Date;
  lastLogin?: Date;
  expos?: Array<{
    expoId: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
  exhibitorProfiles?: Array<{
    profileId: string;
    companyName: string;
    status: string;
    createdAt: Date;
  }>;
  attendeeRegistrations?: Array<{
    registrationId: string;
    expoTitle: string;
    status: string;
    registeredAt: Date;
  }>;
  sessionBookmarks?: Array<{
    bookmarkId: string;
    sessionTitle: string;
    sessionId: string;
    bookmarkedAt: Date;
  }>;
  messages?: Array<{
    messageId: string;
    subject: string;
    sentAt: Date;
    receivedAt?: Date;
  }>;
  feedbackSubmissions?: Array<{
    feedbackId: string;
    category: string;
    subject: string;
    status: string;
    submittedAt: Date;
  }>;
}

/**
 * Export all user data
 * Implements T231, FR-007
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Export user basic data
    const exportData: UserDataExport = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
      isEmailVerified: user.isEmailVerified,
      gdprConsent: {
        marketingConsent: user.gdprConsent.marketingConsent,
        dataProcessingConsent: user.gdprConsent.dataProcessingConsent,
        consentDate: user.gdprConsent.consentDate,
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    // Export expos (if organizer)
    if (user.role === 'organizer' || user.role === 'admin') {
      const expos = await ExpoEvent.find({ organizer: userObjectId })
        .select('_id title status createdAt')
        .lean();
      exportData.expos = expos.map((expo) => ({
        expoId: expo._id.toString(),
        title: expo.title,
        status: expo.status,
        createdAt: expo.createdAt,
      }));
    }

    // Export exhibitor profiles
    const exhibitorProfiles = await ExhibitorProfile.find({ user: userObjectId })
      .select('_id companyName registrationStatus createdAt')
      .lean();
    exportData.exhibitorProfiles = exhibitorProfiles.map((profile) => ({
      profileId: profile._id.toString(),
      companyName: profile.companyName,
      status: profile.registrationStatus,
      createdAt: profile.createdAt,
    }));

    // Export attendee registrations
    const attendeeRegistrations = await AttendeeRegistration.find({ user: userObjectId })
      .populate('expo', 'title')
      .select('_id expo attendanceStatus createdAt')
      .lean();
    exportData.attendeeRegistrations = attendeeRegistrations.map((reg) => ({
      registrationId: reg._id.toString(),
      expoTitle: (reg.expo as any)?.title || 'Unknown',
      status: reg.attendanceStatus,
      registeredAt: reg.createdAt,
    }));

    // Export session bookmarks
    const bookmarks = await SessionBookmark.find({ user: userObjectId })
      .populate('session', 'title')
      .select('_id session createdAt')
      .lean();
    exportData.sessionBookmarks = bookmarks.map((bookmark) => ({
      bookmarkId: bookmark._id.toString(),
      sessionTitle: (bookmark.session as any)?.title || 'Unknown',
      sessionId: (bookmark.session as any)?._id.toString() || '',
      bookmarkedAt: bookmark.createdAt,
    }));

    // Export messages (sent and received)
    const messages = await Message.find({
      $or: [{ sender: userObjectId }, { recipient: userObjectId }],
    })
      .select('_id subject createdAt')
      .sort({ createdAt: -1 })
      .limit(100) // Limit to most recent 100 messages
      .lean();
    exportData.messages = messages.map((msg) => ({
      messageId: msg._id.toString(),
      subject: msg.subject || 'No subject',
      sentAt: msg.createdAt,
      receivedAt: msg.createdAt, // Simplified for export
    }));

    // Export feedback submissions
    const feedback = await FeedbackSubmission.find({ submitter: userObjectId })
      .select('_id category subject status createdAt')
      .lean();
    exportData.feedbackSubmissions = feedback.map((fb) => ({
      feedbackId: fb._id.toString(),
      category: fb.category,
      subject: fb.subject,
      status: fb.status,
      submittedAt: fb.createdAt,
    }));

    logger.info('User data exported', { userId });

    return exportData;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in exportUserData service:', error);
    throw new CustomError('Failed to export user data', 500, 'GDPR_EXPORT_ERROR');
  }
}

/**
 * Delete user account and anonymize data
 * Implements T232, FR-007
 * - Cascade delete user data where appropriate
 * - Anonymize data where retention is required (e.g., expo records)
 * - 30-day grace period before permanent deletion
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const anonymizedEmail = `deleted-${user._id.toString()}@deleted.local`;
    const anonymizedName = 'Deleted User';

    // Anonymize user account (mark for deletion with grace period)
    user.email = anonymizedEmail;
    user.profile.firstName = anonymizedName;
    user.profile.lastName = '';
    user.profile.phone = undefined;
    user.profile.avatar = undefined;
    const cryptoModule = require('crypto');
    user.passwordHash = cryptoModule.randomBytes(32).toString('hex'); // Invalidate password
    user.isEmailVerified = false;
    user.gdprConsent.marketingConsent = false;
    user.gdprConsent.dataProcessingConsent = false;
    // Mark deletion date (30-day grace period)
    (user as any).deletedAt = new Date();

    // Anonymize feedback submissions (keep for record but remove personal data)
    await FeedbackSubmission.updateMany(
      { submitter: userObjectId },
      {
        $set: {
          'submitter': null, // Remove reference but keep submission
        },
      }
    );

    // Delete session bookmarks (user-specific, can be deleted)
    await SessionBookmark.deleteMany({ user: userObjectId });

    // Delete attendee registrations (user-specific)
    await AttendeeRegistration.deleteMany({ user: userObjectId });

    // Anonymize messages (keep messages but remove personal references)
    await Message.updateMany(
      { sender: userObjectId },
      {
        $set: {
          sender: null,
          'senderName': anonymizedName,
        },
      }
    );
    await Message.updateMany(
      { recipient: userObjectId },
      {
        $set: {
          recipient: null,
          'recipientName': anonymizedName,
        },
      }
    );

    // For exhibitor profiles: if approved/active, mark as deleted but keep for expo records
    // If pending/rejected, can be deleted
    const exhibitorProfiles = await ExhibitorProfile.find({ user: userObjectId });
    for (const profile of exhibitorProfiles) {
      if (profile.registrationStatus === 'approved') {
        // Keep profile but anonymize
        profile.companyName = `Deleted Company (${profile._id.toString()})`;
        profile.description = '[Account deleted]';
        // Note: Additional fields like website, contactEmail, contactPhone would be anonymized here
        // if they exist in the schema
        await profile.save();
      } else {
        // Can delete pending/rejected profiles
        await ExhibitorProfile.findByIdAndDelete(profile._id);
      }
    }

    // For expos: if user is organizer, transfer to system/admin or mark as cancelled
    // This is a business decision - for now, we'll mark expos as cancelled
    if (user.role === 'organizer') {
      await ExpoEvent.updateMany(
        { organizer: userObjectId },
        {
          $set: {
            status: 'cancelled',
            // Could transfer ownership to admin user if needed
          },
        }
      );
    }

    // Save anonymized user account
    await user.save();

    logger.info('User account deleted and data anonymized', {
      userId,
      deletedAt: new Date().toISOString(),
    });

    // Note: In a production system, you might want to:
    // 1. Schedule actual deletion after 30 days via a cron job
    // 2. Send confirmation email to user
    // 3. Log deletion event for compliance
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in deleteUserAccount service:', error);
    throw new CustomError('Failed to delete user account', 500, 'GDPR_DELETE_ERROR');
  }
}

