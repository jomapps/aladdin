// Clone Tracker

import { getOpenDatabase } from '@/lib/db/openDatabase';

export interface CloneRecord {
  sourceProjectId: string;
  targetProjectId: string;
  contentType: string;
  originalDocumentId: string;
  newDocumentId: string;
  clonedBy: string;
  idMapping: Record<string, string>;
  createdAt?: Date;
}

export class CloneTracker {
  async recordClone(record: CloneRecord): Promise<void> {
    try {
      const targetDb = await getOpenDatabase(record.targetProjectId);
      await targetDb.collection('clone_logs').insertOne({ ...record, createdAt: new Date() });
    } catch (error) {
      console.error('Failed to record clone:', error);
    }
  }

  async getCloneHistory(projectId: string, documentId: string): Promise<CloneRecord[]> {
    try {
      const db = await getOpenDatabase(projectId);
      return await db.collection('clone_logs').find({
        $or: [{ originalDocumentId: documentId }, { newDocumentId: documentId }]
      }).sort({ createdAt: -1 }).toArray();
    } catch (error) {
      return [];
    }
  }
}
