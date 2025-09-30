# Qualified Information Pattern

**Version**: 1.0.0  
**Last Updated**: January 28, 2025  
**Critical Pattern**: Core to Aladdin's data quality system

---

## Overview

The **Qualified Information Pattern** is the foundational principle that ensures only validated, quality-checked information enters the Brain and becomes part of the project's knowledge base.

**Core Principle**: 
> "Quality gates prevent low-quality data from polluting the knowledge graph and future validations."

---

## The Pattern

### Step 1: New Information Arrives

Source can be:
- User input via chat
- AI agent generation
- Imported/cloned content
- File uploads
- API integrations

### Step 2: Validity & Quality Testing

**Initial Assessment (Pre-Brain):**

```typescript
interface QualityCheck {
  // Completeness
  hasRequiredFields: boolean;      // At minimum: 'name'
  hasMinimumContent: boolean;      // Not just empty strings
  
  // Format
  structureValid: boolean;         // JSON/schema valid
  typeConsistent: boolean;         // Types match expectations
  
  // Basic Coherence
  isCoherent: boolean;             // Makes basic sense
  noObviousErrors: boolean;        // No formatting/parsing issues
  
  // Overall
  passesInitialCheck: boolean;     // All above true
}
```

**Decision Point:**
- ✅ **PASS** → Send to Brain for deep validation
- ❌ **FAIL** → Chat asks qualifying questions
- ⚠️ **UNCERTAIN** → Request user clarification

### Step 3: Brain Validation (Deep Analysis)

**Only for content that passed initial check:**

```typescript
interface BrainValidation {
  // Semantic Analysis
  embedding: vector;               // Generated embedding
  similarityToExisting: number;    // 0-1 score
  
  // Consistency Checks
  contradictions: Array<{
    existingContent: string;       // What it contradicts
    severity: 'high' | 'medium' | 'low';
    explanation: string;
  }>;
  
  // Quality Dimensions
  coherence: number;               // 0-1: Fits with story
  creativity: number;              // 0-1: Novel and engaging
  technical: number;               // 0-1: Well-structured
  consistency: number;             // 0-1: No contradictions
  userIntent: number;              // 0-1: Matches request
  
  // Overall Score
  qualityRating: number;           // Weighted average
  
  // Recommendations
  suggestions: string[];           // Improvements
  relatedContent: string[];        // Similar existing content
  
  // Decision
  shouldIngest: boolean;           // quality ≥ threshold
}
```

### Step 4: Storage Decision

**If quality score ≥ threshold (e.g., 0.60):**

```typescript
// Determine storage location
if (hasKnownStructure) {
  // Store in PayloadCMS
  await payload.create({
    collection: collectionName,
    data: {
      ...content,
      qualityRating,
      brainValidated: true,
      validatedAt: new Date()
    }
  });
} else {
  // Store in Open MongoDB
  await openDb.collection(collectionName).insertOne({
    name: content.name,
    projectId,
    content,
    qualityRating,
    brainValidated: true,
    validatedAt: new Date()
  });
}

// Add to Brain knowledge graph
await brain.addNode({
  type: contentType,
  id: documentId,
  projectId,
  embedding,
  qualityRating,
  ...keyProperties
});

// Now available for future validations ✓
```

**If quality too low:**

```typescript
// Present to user in chat
return {
  type: 'quality_issue',
  content: generatedContent,
  qualityRating,
  issues: validation.contradictions,
  suggestions: validation.suggestions,
  actions: [
    { id: 'modify', label: 'Modify and retry' },
    { id: 'discard', label: 'Discard' },
    { id: 'accept_anyway', label: 'Accept (mark as low quality)' }
  ]
};
```

### Step 5: Future Use in Validations

**Building Knowledge Over Time:**

```typescript
// When validating NEW content
const validation = await brain.validate(newContent, {
  projectId,
  compareAgainst: 'brain_validated_only',  // CRITICAL
  minQuality: 0.60
});

// Brain queries ONLY validated content:
// - Characters with brainValidated: true
// - Scenes with brainValidated: true
// - Locations with brainValidated: true
// etc.

// This ensures:
// ✓ High-quality reference data
// ✓ No garbage-in-garbage-out
// ✓ Validation accuracy improves over time
```

---

## Chat Qualifying Questions

When the system cannot determine information quality, it engages the user:

### Question Types

**1. Clarification Requests**
```
"I need more information to validate this character:
- What is their primary motivation?
- How do they relate to [existing character]?"
```

**2. Contradiction Resolution**
```
"This seems to contradict existing content:

New: Sarah is 32 years old
Existing: Episode 1 established Sarah as 28

Which should I use?"
```

**3. Quality Threshold**
```
"The quality score for this scene is 0.65 (borderline):

Issues:
- Dialogue feels generic
- Motivation unclear

Would you like me to:
1. Refine and regenerate
2. Accept as-is
3. Let you edit manually"
```

**4. Missing Information**
```
"To create a quality character profile, I recommend adding:
- Physical description
- Key personality traits
- Backstory summary

Should I generate these, or do you want to provide them?"
```

---

## Project Isolation with Content Cloning

### Isolation Principle

**Each project is completely isolated:**
- Separate open database: `open_[project-slug]`
- Separate Brain subgraph in Neo4j
- No cross-project queries during validation
- No data leakage between projects

### Content Cloning

**Users can selectively clone content between projects:**

```typescript
// User: "Clone character Sarah from ProjectA to ProjectB"

const cloneCharacter = async (sourceProjectId, targetProjectId, characterId) => {
  // 1. Read source
  const source = await getCharacter(sourceProjectId, characterId);
  
  // 2. Create new document in target project
  const cloned = {
    name: source.name,
    projectId: targetProjectId,  // NEW project binding
    content: { ...source.content },
    
    // Mark as cloned
    clonedFrom: {
      projectId: sourceProjectId,
      documentId: characterId,
      clonedAt: new Date()
    },
    
    // Reset validation (must validate in new context)
    brainValidated: false,
    qualityRating: null,
    userApproved: false
  };
  
  // 3. Validate in TARGET project context
  const validation = await brain.validate(cloned, {
    projectId: targetProjectId,  // Validate against ProjectB
    compareAgainst: 'brain_validated_only'
  });
  
  // 4. Store if valid
  if (validation.qualityRating >= threshold) {
    const newId = await saveCharacter(targetProjectId, {
      ...cloned,
      brainValidated: true,
      qualityRating: validation.qualityRating
    });
    
    // 5. Add to ProjectB's Brain
    await brain.addNode({
      projectId: targetProjectId,
      type: 'character',
      id: newId,
      ...cloned
    });
  }
  
  return cloned;
};
```

**Key Points:**
- Cloned content gets NEW `projectId` and `_id`
- Must pass validation in destination project
- Original and clone are completely independent
- Changes to clone don't affect original
- Brain validates against destination project only

---

## Implementation Checklist

### Initial Quality Check
- [ ] Validate required fields (minimum: `name`)
- [ ] Check structure and format
- [ ] Basic coherence assessment
- [ ] Return pass/fail/uncertain

### Brain Validation
- [ ] Generate embeddings
- [ ] Compare against existing (validated) content
- [ ] Check contradictions
- [ ] Calculate quality dimensions
- [ ] Return overall quality rating

### Storage Decision
- [ ] Route to PayloadCMS or Open MongoDB
- [ ] Tag with `brainValidated: true`
- [ ] Store `qualityRating`
- [ ] Add to Neo4j knowledge graph

### Chat Interaction
- [ ] Ask qualifying questions when uncertain
- [ ] Present quality issues to user
- [ ] Offer actions: modify/discard/accept
- [ ] Handle user responses

### Future Validations
- [ ] Query only Brain-validated content
- [ ] Use for new content validation
- [ ] Build knowledge over time
- [ ] Improve accuracy iteratively

### Project Isolation
- [ ] Separate databases per project
- [ ] Separate Brain subgraphs
- [ ] Scope queries by projectId
- [ ] No cross-project validation

### Content Cloning
- [ ] Read from source project
- [ ] Create new document in target
- [ ] Assign new projectId and _id
- [ ] Validate in target context
- [ ] Store clonedFrom reference
- [ ] Maintain independence

---

## Benefits

1. **Data Quality**: Only validated information in knowledge base
2. **Accuracy**: Validation improves over time
3. **User Control**: Chat engages user when uncertain
4. **Flexibility**: Works for both structured and unstructured data
5. **Isolation**: Projects remain independent
6. **Reusability**: Content can be cloned between projects
7. **Transparency**: Users see quality scores and issues
8. **Iterative**: System learns from each validation

---

**Status**: Core Pattern Documented ✓  
**Integration**: SPECIFICATION.md, DATA_MODELS.md

*This pattern is fundamental to Aladdin's data quality and must be implemented consistently across all content types.*