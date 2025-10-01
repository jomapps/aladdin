/**
 * Activity Tracker
 * Logs user actions and creates audit trail
 */

import { getPayload } from 'payload';
import configPromise from '@payload-config';

export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'content_created'
  | 'content_updated'
  | 'content_deleted'
  | 'content_cloned'
  | 'export_created'
  | 'export_downloaded'
  | 'team_member_added'
  | 'team_member_removed'
  | 'team_member_role_updated'
  | 'asset_uploaded'
  | 'asset_deleted';

export interface ActivityLog {
  id: string;
  userId: string;
  projectId: string;
  action: ActivityAction;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityTracker {
  /**
   * Log user activity
   */
  async logActivity(options: {
    userId: string;
    projectId: string;
    action: ActivityAction;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    try {
      const payload = await getPayload({ config: configPromise });

      const activityLog: ActivityLog = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: options.userId,
        projectId: options.projectId,
        action: options.action,
        metadata: options.metadata,
        timestamp: new Date(),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      };

      // Store in ActivityLogs collection
      await payload.create({
        collection: 'activity-logs',
        data: activityLog,
      });

      return activityLog;
    } catch (error) {
      console.error('Log activity error:', error);
      throw error;
    }
  }

  /**
   * Get activity feed for a project
   */
  async getActivityFeed(options: {
    projectId: string;
    userId?: string;
    action?: ActivityAction;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: ActivityLog[]; total: number }> {
    try {
      const payload = await getPayload({ config: configPromise });

      const { projectId, userId, action, limit = 50, offset = 0 } = options;

      // Build query
      const where: any = {
        projectId: {
          equals: projectId,
        },
      };

      if (userId) {
        where.userId = { equals: userId };
      }

      if (action) {
        where.action = { equals: action };
      }

      // Query activities
      const result = await payload.find({
        collection: 'activity-logs',
        where,
        sort: '-timestamp',
        limit,
        page: Math.floor(offset / limit) + 1,
      });

      return {
        activities: result.docs as any[],
        total: result.totalDocs,
      };
    } catch (error) {
      console.error('Get activity feed error:', error);
      throw error;
    }
  }

  /**
   * Get user's activity history
   */
  async getUserActivityHistory(
    userId: string,
    limit: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const payload = await getPayload({ config: configPromise });

      const result = await payload.find({
        collection: 'activity-logs',
        where: {
          userId: {
            equals: userId,
          },
        },
        sort: '-timestamp',
        limit,
      });

      return result.docs as any[];
    } catch (error) {
      console.error('Get user activity history error:', error);
      throw error;
    }
  }

  /**
   * Get recent activities across all projects (for dashboard)
   */
  async getRecentActivities(
    userId: string,
    limit: number = 20
  ): Promise<ActivityLog[]> {
    try {
      const payload = await getPayload({ config: configPromise });

      // Get all projects user has access to
      const projects = await payload.find({
        collection: 'projects',
        where: {
          or: [
            { createdBy: { equals: userId } },
            { 'team.user': { equals: userId } },
          ],
        },
      });

      const projectIds = projects.docs.map((p) => p.id);

      if (projectIds.length === 0) {
        return [];
      }

      // Get recent activities from those projects
      const result = await payload.find({
        collection: 'activity-logs',
        where: {
          projectId: {
            in: projectIds,
          },
        },
        sort: '-timestamp',
        limit,
      });

      return result.docs as any[];
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(projectId: string, days: number = 30): Promise<{
    totalActivities: number;
    actionBreakdown: Record<ActivityAction, number>;
    activeUsers: number;
  }> {
    try {
      const payload = await getPayload({ config: configPromise });

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const result = await payload.find({
        collection: 'activity-logs',
        where: {
          and: [
            { projectId: { equals: projectId } },
            { timestamp: { greater_than: sinceDate.toISOString() } },
          ],
        },
        limit: 10000, // Large limit for stats
      });

      const activities = result.docs as ActivityLog[];

      // Calculate breakdown
      const actionBreakdown: Record<ActivityAction, number> = {} as any;
      const uniqueUsers = new Set<string>();

      for (const activity of activities) {
        // Count actions
        if (!actionBreakdown[activity.action]) {
          actionBreakdown[activity.action] = 0;
        }
        actionBreakdown[activity.action]++;

        // Track unique users
        uniqueUsers.add(activity.userId);
      }

      return {
        totalActivities: activities.length,
        actionBreakdown,
        activeUsers: uniqueUsers.size,
      };
    } catch (error) {
      console.error('Get activity stats error:', error);
      throw error;
    }
  }

  /**
   * Export audit trail (for compliance)
   */
  async exportAuditTrail(options: {
    projectId: string;
    startDate: Date;
    endDate: Date;
    format?: 'json' | 'csv';
  }): Promise<string> {
    try {
      const payload = await getPayload({ config: configPromise });
      const { projectId, startDate, endDate, format = 'json' } = options;

      const result = await payload.find({
        collection: 'activity-logs',
        where: {
          and: [
            { projectId: { equals: projectId } },
            { timestamp: { greater_than_equal: startDate.toISOString() } },
            { timestamp: { less_than_equal: endDate.toISOString() } },
          ],
        },
        sort: 'timestamp',
        limit: 100000, // Large limit for export
      });

      const activities = result.docs;

      if (format === 'csv') {
        return this.convertToCSV(activities);
      }

      return JSON.stringify(activities, null, 2);
    } catch (error) {
      console.error('Export audit trail error:', error);
      throw error;
    }
  }

  /**
   * Convert activities to CSV format
   */
  private convertToCSV(activities: any[]): string {
    if (activities.length === 0) {
      return 'No activities found';
    }

    const headers = ['Timestamp', 'User ID', 'Project ID', 'Action', 'Metadata', 'IP Address'];
    const rows = activities.map((activity) => [
      activity.timestamp,
      activity.userId,
      activity.projectId,
      activity.action,
      JSON.stringify(activity.metadata || {}),
      activity.ipAddress || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Delete old activity logs (for cleanup)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const payload = await getPayload({ config: configPromise });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await payload.find({
        collection: 'activity-logs',
        where: {
          timestamp: {
            less_than: cutoffDate.toISOString(),
          },
        },
      });

      let deletedCount = 0;

      for (const log of result.docs) {
        await payload.delete({
          collection: 'activity-logs',
          id: log.id,
        });
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup old logs error:', error);
      throw error;
    }
  }
}
