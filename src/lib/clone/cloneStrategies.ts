// Clone Strategies for Different Content Types

import type { CloneStrategy, CloneContext, ContentType } from './types';

/**
 * Character Cloning Strategy
 */
class CharacterCloneStrategy implements CloneStrategy {
  canHandle(contentType: ContentType): boolean {
    return contentType === 'character';
  }

  async clone(documentId: string, context: CloneContext): Promise<string> {
    const { sourceDb, targetDb } = context;

    const sourceDoc = await sourceDb.collection('characters').findOne({ _id: documentId });
    if (!sourceDoc) throw new Error(`Character ${documentId} not found`);

    const newDoc = {
      ...sourceDoc,
      _id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clonedFrom: { projectId: sourceDoc.projectId, documentId: sourceDoc._id, clonedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    delete newDoc._id;

    const result = await targetDb.collection('characters').insertOne(newDoc);
    return result.insertedId.toString();
  }

  async getDependencies(documentId: string, sourceDb: any): Promise<string[]> {
    return [];
  }
}

/**
 * Scene Cloning Strategy
 */
class SceneCloneStrategy implements CloneStrategy {
  canHandle(contentType: ContentType): boolean {
    return contentType === 'scene';
  }

  async clone(documentId: string, context: CloneContext): Promise<string> {
    const { sourceDb, targetDb, idMapping } = context;

    const sourceDoc = await sourceDb.collection('scenes').findOne({ _id: documentId });
    if (!sourceDoc) throw new Error(`Scene ${documentId} not found`);

    const newDoc = {
      ...sourceDoc,
      _id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characters: sourceDoc.characters?.map((charId: string) => idMapping.get(charId) || charId),
      clonedFrom: { projectId: sourceDoc.projectId, documentId: sourceDoc._id, clonedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    delete newDoc._id;

    const result = await targetDb.collection('scenes').insertOne(newDoc);
    return result.insertedId.toString();
  }

  async getDependencies(documentId: string, sourceDb: any): Promise<string[]> {
    const scene = await sourceDb.collection('scenes').findOne({ _id: documentId });
    return scene?.characters || [];
  }
}

export const cloneStrategies: CloneStrategy[] = [
  new CharacterCloneStrategy(),
  new SceneCloneStrategy(),
];
