import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB connection configuration with connection pooling, error handling, and retry logic
 * Implements constitutional requirements for reliability and observability
 */
class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB with connection pooling and retry logic
   * @param uri MongoDB connection string
   * @param maxRetries Maximum number of connection retry attempts
   * @param retryDelay Delay between retries in milliseconds
   */
  public async connect(
    uri: string,
    maxRetries = 5,
    retryDelay = 5000
  ): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    let retries = 0;

    while (retries < maxRetries) {
      try {
        const options: mongoose.ConnectOptions = {
          // Connection pool settings
          maxPoolSize: 10, // Maintain up to 10 socket connections
          minPoolSize: 2, // Maintain at least 2 socket connections
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          serverSelectionTimeoutMS: 5000, // How long to try selecting a server
          heartbeatFrequencyMS: 10000, // How often to check server status

          // Retry settings
          retryWrites: true,
          retryReads: true,

          // Performance settings
          bufferCommands: false, // Disable mongoose buffering
          // bufferMaxEntries removed in mongoose 8.x // Disable mongoose buffering
        };

        await mongoose.connect(uri, options);
        this.isConnected = true;

        logger.info('MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (error: Error) => {
          logger.error('MongoDB connection error:', error);
          this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
          this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
          logger.info('MongoDB reconnected');
          this.isConnected = true;
        });

        // Handle process termination
        process.on('SIGINT', this.gracefulDisconnect.bind(this));
        process.on('SIGTERM', this.gracefulDisconnect.bind(this));

        return;
      } catch (error) {
        retries++;
        logger.error(
          `MongoDB connection attempt ${retries}/${maxRetries} failed:`,
          error
        );

        if (retries >= maxRetries) {
          logger.error('MongoDB connection failed after max retries');
          throw new Error(
            `Failed to connect to MongoDB after ${maxRetries} attempts: ${error}`
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Gracefully disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Graceful disconnect handler for process termination
   */
  private async gracefulDisconnect(): Promise<void> {
    logger.info('Received termination signal, closing MongoDB connection...');
    await this.disconnect();
    process.exit(0);
  }

  /**
   * Check if database is connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const database = Database.getInstance();
export default database;

