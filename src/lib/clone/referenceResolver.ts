// Reference Resolver

export class ReferenceResolver {
  async rewriteReferences(documentIds: string[], idMapping: Map<string, string>, targetDb: any): Promise<void> {
    for (const docId of documentIds) {
      const collections = ['characters', 'scenes', 'episodes', 'locations'];
      for (const collectionName of collections) {
        const doc = await targetDb.collection(collectionName).findOne({ _id: docId });
        if (doc) {
          const rewrittenDoc = this.rewriteObjectReferences(doc, idMapping);
          await targetDb.collection(collectionName).updateOne({ _id: docId }, { $set: rewrittenDoc });
          break;
        }
      }
    }
  }

  private rewriteObjectReferences(obj: any, idMapping: Map<string, string>): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.rewriteObjectReferences(item, idMapping));

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && this.looksLikeId(value)) {
        result[key] = idMapping.get(value) || value;
      } else if (typeof value === 'object') {
        result[key] = this.rewriteObjectReferences(value, idMapping);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private looksLikeId(value: string): boolean {
    return /^(char|scene|episode|location|prop)_/.test(value);
  }
}
