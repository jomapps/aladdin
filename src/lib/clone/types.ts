// Clone System Types

export type ContentType = 'character' | 'scene' | 'episode' | 'location' | 'prop' | 'workflow';

export interface CloneRequest {
  sourceProjectId: string;
  targetProjectId: string;
  contentType: ContentType;
  documentId: string;
  options?: {
    includeMedia?: boolean;
    includeBrainData?: boolean;
    preserveReferences?: boolean;
  };
}

export interface CloneResult {
  success: boolean;
  newId: string;
  clonedFrom: {
    projectId: string;
    documentId: string;
  };
  clonedAt: Date;
  idMapping: Record<string, string>;
  errors?: string[];
}

export interface CloneContext {
  sourceDb: any;
  targetDb: any;
  idMapping: Map<string, string>;
  clonedEntities: Set<string>;
  errors: string[];
}

export interface DependencyNode {
  id: string;
  type: ContentType;
  dependencies: string[];
}

export interface CloneStrategy {
  canHandle(contentType: ContentType): boolean;
  clone(documentId: string, context: CloneContext): Promise<string>;
  getDependencies(documentId: string, sourceDb: any): Promise<string[]>;
}

export interface CloneMetadata {
  originalProjectId: string;
  originalDocumentId: string;
  clonedAt: Date;
  clonedBy: string;
  cloneGeneration: number;
  cloneRoot?: string;
}
