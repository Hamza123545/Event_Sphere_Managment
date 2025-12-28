/**
 * Export Service
 * Handles exporting analytics data to various formats (PDF, CSV, JSON)
 * Implements T181
 */

import PDFDocument from 'pdfkit';
import type { AnalyticsResult } from './analyticsService';

/**
 * Generate PDF report from analytics data
 * Implements T181
 */
export async function generatePDF(analytics: AnalyticsResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`Analytics Report: ${analytics.expoTitle}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${analytics.generatedAt.toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Attendee Count Metrics
      if (analytics.attendeeCount) {
        doc.fontSize(16).text('Attendee Count Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Total Attendees: ${analytics.attendeeCount.total}`);
        doc.text(`Registered: ${analytics.attendeeCount.registered}`);
        doc.text(`Checked In: ${analytics.attendeeCount.checkedIn}`);
        doc.text(`No Shows: ${analytics.attendeeCount.noShow}`);
        doc.moveDown(2);
      }

      // Session Popularity Metrics
      if (analytics.sessionPopularity) {
        doc.fontSize(16).text('Session Popularity', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        analytics.sessionPopularity.sessions.forEach((session: { title: string; registrations: number; capacity: number; utilizationRate: number }, index: number) => {
          doc.text(`${index + 1}. ${session.title}`, { indent: 20 });
          doc.text(`   Registrations: ${session.registrations}`, { indent: 40 });
          doc.text(`   Capacity: ${session.capacity}`, { indent: 40 });
          doc.text(`   Utilization: ${session.utilizationRate}%`, { indent: 40 });
          doc.moveDown(0.5);
        });
        doc.moveDown(2);
      }

      // Booth Traffic Metrics
      if (analytics.boothTraffic) {
        doc.fontSize(16).text('Booth Traffic Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Total Booths: ${analytics.boothTraffic.totalBooths}`);
        doc.text(`Reserved Booths: ${analytics.boothTraffic.reservedBooths}`);
        doc.text(`Available Booths: ${analytics.boothTraffic.availableBooths}`);
        doc.text(`Occupancy Rate: ${analytics.boothTraffic.occupancyRate}%`);
        doc.moveDown(2);
      }

      // Engagement Rate Metrics
      if (analytics.engagementRate) {
        doc.fontSize(16).text('Engagement Rate Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Total Attendees: ${analytics.engagementRate.totalAttendees}`);
        doc.text(`Attendees with Bookmarks: ${analytics.engagementRate.attendeesWithBookmarks}`);
        doc.text(`Average Bookmarks per Attendee: ${analytics.engagementRate.averageBookmarksPerAttendee}`);
        doc.text(`Engagement Rate: ${analytics.engagementRate.engagementRate}%`);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate CSV report from analytics data
 * Implements T181
 */
export async function generateCSV(analytics: AnalyticsResult): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push(`Analytics Report: ${analytics.expoTitle}`);
  lines.push(`Generated: ${analytics.generatedAt.toLocaleString()}`);
  lines.push('');

  // Attendee Count Metrics
  if (analytics.attendeeCount) {
    lines.push('Attendee Count Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Attendees,${analytics.attendeeCount.total}`);
    lines.push(`Registered,${analytics.attendeeCount.registered}`);
    lines.push(`Checked In,${analytics.attendeeCount.checkedIn}`);
    lines.push(`No Shows,${analytics.attendeeCount.noShow}`);
    lines.push('');
  }

  // Session Popularity Metrics
  if (analytics.sessionPopularity) {
    lines.push('Session Popularity');
    lines.push('Session Title,Registrations,Capacity,Utilization Rate (%)');
    analytics.sessionPopularity.sessions.forEach((session: { title: string; registrations: number; capacity: number; utilizationRate: number }) => {
      lines.push(`"${session.title}",${session.registrations},${session.capacity},${session.utilizationRate}`);
    });
    lines.push('');
  }

  // Booth Traffic Metrics
  if (analytics.boothTraffic) {
    lines.push('Booth Traffic Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Booths,${analytics.boothTraffic.totalBooths}`);
    lines.push(`Reserved Booths,${analytics.boothTraffic.reservedBooths}`);
    lines.push(`Available Booths,${analytics.boothTraffic.availableBooths}`);
    lines.push(`Occupancy Rate (%),${analytics.boothTraffic.occupancyRate}`);
    lines.push('');
  }

  // Engagement Rate Metrics
  if (analytics.engagementRate) {
    lines.push('Engagement Rate Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Attendees,${analytics.engagementRate.totalAttendees}`);
    lines.push(`Attendees with Bookmarks,${analytics.engagementRate.attendeesWithBookmarks}`);
    lines.push(`Average Bookmarks per Attendee,${analytics.engagementRate.averageBookmarksPerAttendee}`);
    lines.push(`Engagement Rate (%),${analytics.engagementRate.engagementRate}`);
  }

  return lines.join('\n');
}

/**
 * Generate JSON report from analytics data
 * Implements T181
 */
export async function generateJSON(analytics: AnalyticsResult): Promise<string> {
  return JSON.stringify(analytics, null, 2);
}

