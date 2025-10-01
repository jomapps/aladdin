// Content Cloning Main Orchestrator

import { getOpenDatabase } from '@/lib/db/openDatabase';
import type { CloneRequest, CloneResult, CloneContext, DependencyNode } from './types';
import { cloneStrategies } from './cloneStrategies';
import { ReferenceResolver } from './referenceResolver';
import { CloneTracker } from './cloneTracker';

export class ContentCloner {
  private referenceResolver: ReferenceResolver;
  private tracker: CloneTracker;

  constructor() {
    this.referenceResolver = new ReferenceResolver();
    this.tracker = new CloneTracker();
  }

  async cloneContent(request: CloneRequest): Promise<CloneResult> {
    const { sourceProjectId, targetProjectId, contentType, documentId } = request;

    try {
      const sourceDb = await getOpenDatabase(sourceProjectId);
      const targetDb = await getOpenDatabase(targetProjectId);

      const context: CloneContext = {
        sourceDb,
        targetDb,
        idMapping: new Map(),
        clonedEntities: new Set(),
        errors: [],
      };

      const strategy = cloneStrategies.find(s => s.canHandle(contentType));
      if (!strategy) {
        throw new Error(`No strategy for type: ${contentType}`);
      }

      const newId = await strategy.clone(documentId, context);
      context.idMapping.set(documentId, newId);

      await this.referenceResolver.rewriteReferences(
        [newId],
        context.idMapping,
        targetDb
      );

      await this.tracker.recordClone({
        sourceProjectId,
        targetProjectId,
        contentType,
        originalDocumentId: documentId,
        newDocumentId: newId,
        clonedBy: 'system',
        idMapping: Object.fromEntries(context.idMapping),
      });

      return {
        success: true,
        newId,
        clonedFrom: { projectId: sourceProjectId, documentId },
        clonedAt: new Date(),
        idMapping: Object.fromEntries(context.idMapping),
      };
    } catch (error: any) {
      return {
        success: false,
        newId: '',
        clonedFrom: { projectId: sourceProjectId, documentId },
        clonedAt: new Date(),
        idMapping: {},
        errors: [error.message],
      };
    }
  }
}

export const contentCloner = new ContentCloner();
