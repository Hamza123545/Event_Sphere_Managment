/**
 * Database Seed Script
 * Implements T269 - Create database seed script with sample data for development
 * Creates sample data matching quickstart.md: users, expos, exhibitors, sessions
 */

import bcrypt from 'bcryptjs';
import database from '../config/database';
import { User } from '../models/User';
import { ExpoEvent } from '../models/ExpoEvent';
import { ExhibitorProfile } from '../models/ExhibitorProfile';
import { Session } from '../models/Session';
import { AttendeeRegistration } from '../models/AttendeeRegistration';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventsphere';

/**
 * Seed database with sample data
 */
async function seedDatabase(): Promise<void> {
  try {
    // Connect to database
    await database.connect(MONGODB_URI);
    logger.info('Connected to database for seeding');

    // Clear existing data (optional - comment out to preserve data)
    // await User.deleteMany({});
    // await ExpoEvent.deleteMany({});
    // await ExhibitorProfile.deleteMany({});
    // await Session.deleteMany({});
    // await AttendeeRegistration.deleteMany({});

    // Create sample users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const organizerPassword = await bcrypt.hash('organizer123', 10);
    const exhibitorPassword = await bcrypt.hash('exhibitor123', 10);
    const attendeePassword = await bcrypt.hash('attendee123', 10);

    const admin = await User.findOneAndUpdate(
      { email: 'admin@eventsphere.com' },
      {
        email: 'admin@eventsphere.com',
        passwordHash: adminPassword,
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1-555-0000',
        },
        isEmailVerified: true,
        gdprConsent: {
          marketingConsent: true,
          dataProcessingConsent: true,
          consentDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const organizer = await User.findOneAndUpdate(
      { email: 'organizer@eventsphere.com' },
      {
        email: 'organizer@eventsphere.com',
        passwordHash: organizerPassword,
        role: 'organizer',
        profile: {
          firstName: 'John',
          lastName: 'Organizer',
          phone: '+1-555-0101',
        },
        isEmailVerified: true,
        gdprConsent: {
          marketingConsent: true,
          dataProcessingConsent: true,
          consentDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const exhibitor1 = await User.findOneAndUpdate(
      { email: 'exhibitor1@eventsphere.com' },
      {
        email: 'exhibitor1@eventsphere.com',
        passwordHash: exhibitorPassword,
        role: 'exhibitor',
        profile: {
          firstName: 'Jane',
          lastName: 'Exhibitor',
          phone: '+1-555-0202',
        },
        isEmailVerified: true,
        gdprConsent: {
          marketingConsent: true,
          dataProcessingConsent: true,
          consentDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const attendee1 = await User.findOneAndUpdate(
      { email: 'attendee1@eventsphere.com' },
      {
        email: 'attendee1@eventsphere.com',
        passwordHash: attendeePassword,
        role: 'attendee',
        profile: {
          firstName: 'Bob',
          lastName: 'Attendee',
          phone: '+1-555-0303',
        },
        isEmailVerified: true,
        gdprConsent: {
          marketingConsent: true,
          dataProcessingConsent: true,
          consentDate: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logger.info('Created sample users');

    // Create sample expo
    const expoStartDate = new Date();
    expoStartDate.setDate(expoStartDate.getDate() + 30); // 30 days from now
    const expoEndDate = new Date(expoStartDate);
    expoEndDate.setDate(expoEndDate.getDate() + 3); // 3-day event

    const expo = await ExpoEvent.findOneAndUpdate(
      { title: 'Tech Innovation Expo 2024' },
      {
        title: 'Tech Innovation Expo 2024',
        description: 'A comprehensive technology innovation expo showcasing the latest in AI, cloud computing, and software development. Join us for three days of networking, workshops, and keynote presentations.',
        theme: 'Innovation & Technology',
        dateRange: {
          startDate: expoStartDate,
          endDate: expoEndDate,
        },
        location: {
          venueName: 'Convention Center',
          address: '123 Innovation Drive',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
          zipCode: '94105',
        },
        organizer: organizer._id,
        status: 'upcoming',
      },
      { upsert: true, new: true }
    );

    logger.info('Created sample expo');

    // Create sample exhibitor profile
    await ExhibitorProfile.findOneAndUpdate(
      { user: exhibitor1._id, expo: expo._id },
      {
        user: exhibitor1._id,
        expo: expo._id,
        companyName: 'Tech Solutions Inc.',
        category: 'Software Development',
        description: 'Leading provider of enterprise software solutions and cloud services.',
        contactEmail: exhibitor1.email,
        contactPhone: '+1-555-0202',
        website: 'https://techsolutions.example.com',
        registrationStatus: 'approved',
        companySize: '50-200',
        products: [
          { name: 'Enterprise Cloud Platform', description: 'Scalable cloud infrastructure' },
          { name: 'AI Analytics Suite', description: 'Advanced analytics with AI capabilities' },
        ],
      },
      { upsert: true, new: true }
    );

    logger.info('Created sample exhibitor profile');

    // Create sample sessions
    const session1Start = new Date(expoStartDate);
    session1Start.setHours(10, 0, 0);
    const session1End = new Date(session1Start);
    session1End.setHours(11, 30, 0);

    const session2Start = new Date(expoStartDate);
    session2Start.setHours(14, 0, 0);
    const session2End = new Date(session2Start);
    session2End.setHours(15, 0, 0);

    await Session.findOneAndUpdate(
      { title: 'The Future of AI in Business' },
      {
        expo: expo._id,
        title: 'The Future of AI in Business',
        description: 'Exploring how artificial intelligence is transforming business operations and creating new opportunities.',
        topic: 'Artificial Intelligence',
        category: 'Keynote',
        schedule: {
          startTime: session1Start,
          endTime: session1End,
        },
        speaker: {
          name: 'Dr. Sarah Johnson',
          bio: 'AI researcher and business consultant',
          email: 'sarah.johnson@example.com',
        },
        location: {
          room: 'Main Hall',
          capacity: 500,
        },
        capacity: 500,
        currentAttendees: 0,
      },
      { upsert: true, new: true }
    );

    await Session.findOneAndUpdate(
      { title: 'Cloud Migration Strategies' },
      {
        expo: expo._id,
        title: 'Cloud Migration Strategies',
        description: 'Best practices and strategies for migrating enterprise applications to the cloud.',
        topic: 'Cloud Computing',
        category: 'Workshop',
        schedule: {
          startTime: session2Start,
          endTime: session2End,
        },
        speaker: {
          name: 'Michael Chen',
          bio: 'Cloud architect with 15 years of experience',
          email: 'michael.chen@example.com',
        },
        location: {
          room: 'Workshop Room A',
          capacity: 50,
        },
        capacity: 50,
        currentAttendees: 0,
      },
      { upsert: true, new: true }
    );

    logger.info('Created sample sessions');

    // Create sample attendee registration
    await AttendeeRegistration.findOneAndUpdate(
      { user: attendee1._id, expo: expo._id },
      {
        user: attendee1._id,
        expo: expo._id,
        registrationDate: new Date(),
        attendanceStatus: 'registered',
        preferences: {
          interests: ['AI', 'Cloud Computing'],
          dietaryRestrictions: [],
        },
      },
      { upsert: true, new: true }
    );

    logger.info('Created sample attendee registration');

    logger.info('Database seeding completed successfully!');
    logger.info('\nSample User Credentials:');
    logger.info('Admin: admin@eventsphere.com / admin123');
    logger.info('Organizer: organizer@eventsphere.com / organizer123');
    logger.info('Exhibitor: exhibitor1@eventsphere.com / exhibitor123');
    logger.info('Attendee: attendee1@eventsphere.com / attendee123');

    // Close database connection
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    await database.disconnect();
    process.exit(1);
  }
}

// Run seed script if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;

