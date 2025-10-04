# AI Enhancement Feature for Project Readiness

## Overview

The AI Enhancement feature allows users to automatically improve department evaluations by using AI to generate concrete, production-ready deliverables that address identified issues and suggestions.

## User Flow

1. User completes a department evaluation
2. Evaluation shows issues and suggestions
3. User clicks the **AI Enhance** button (purple sparkles icon)
4. AI analyzes the evaluation and generates concrete deliverables
5. Deliverables are saved to gather database and brain service
6. System automatically re-evaluates the department
7. Rating improves based on the new content

## Key Features

### 1. Smart Content Generation

The AI generates **actual deliverables**, not descriptions:

- ❌ **Bad**: "We should create technical specifications..."
- ✅ **Good**: Complete technical specification document with scene breakdowns, timelines, resource allocations

### 2. Duplicate Prevention

- Fetches existing gather data before generating
- Shows AI what's already been created
- Instructs AI to create NEW, DIFFERENT content each time
- Builds upon existing work rather than repeating it

### 3. Context-Aware

Each deliverable includes:
- Project-specific details (name, genre, themes)
- Department-specific requirements
- Concrete numbers, timelines, and specifications
- Production-ready formats (tables, lists, structured documents)

### 4. Comprehensive Coverage

AI addresses EVERY issue and suggestion with:
- 300-500 word deliverables
- Specific, actionable content
- Copy-paste ready for production use
- Structured formats (tables, timelines, matrices)

## Technical Implementation

### API Endpoint

```
POST /api/v1/project-readiness/[projectId]/department/[departmentId]/enhance
```

**Response:**
```json
{
  "success": true,
  "itemsCreated": 9,
  "message": "Successfully created 9 enhancement items addressing evaluation feedback"
}
```

### Data Flow

1. **Fetch Evaluation** - Get latest completed evaluation from `project-readiness` collection (PayloadCMS)
2. **Get Existing Content** - Fetch up to 50 recent gather items from MongoDB (`aladdin-gather-{projectId}` database)
3. **Generate Improvements** - Use LLM with enhanced prompt to create deliverables
4. **Save to Gather** - Store each deliverable in MongoDB gather collection using `gatherDB.createGatherItem()`
5. **Enrich Data** - Use DataPreparationAgent to add context and relationships
6. **Store in Brain** - Save to brain service with embeddings for semantic search
7. **Auto Re-evaluate** - Trigger new evaluation after 1 second

**Important**: The gather data is stored in MongoDB (not PayloadCMS), in a project-specific database named `aladdin-gather-{projectId}`.

### Prompt Engineering

The prompt is designed to:

1. **Emphasize Concrete Deliverables**
   - "CREATE THE ACTUAL CONTENT" not descriptions
   - Provides detailed examples of good vs bad outputs

2. **Prevent Duplicates**
   - Shows existing content (up to 3000 chars)
   - Explicitly instructs to create NEW content
   - Warns against repetition

3. **Ensure Quality**
   - Minimum 300-500 words per deliverable
   - Requires specific numbers, names, timelines
   - Demands structured formats (tables, lists)
   - Must reference project context

4. **Provide Examples**
   - Shows exactly what to create for common issues
   - Demonstrates proper formatting
   - Illustrates level of detail required

### Example Deliverables

#### For "Story documentation needs more detail"

```
TECHNICAL SPECIFICATIONS FOR [Project Name]

Scene Breakdown Structure:
- Scene 1: Opening sequence (2 min 30 sec)
  * Location: Desert marketplace at dawn
  * Characters: Aladdin (protagonist), 3 merchants, crowd extras
  * Technical requirements: Wide establishing shot, handheld camera
  * Lighting: Golden hour natural light, practical lanterns
  * Props: Market stalls, stolen bread, guard uniforms
  * VFX: None required
  * Audio: Ambient marketplace sounds, footsteps, dialogue
  
[Continues for all major scenes...]
```

#### For "Timeline estimates appear optimistic"

```
REVISED Story Department TIMELINE WITH 20% BUFFER

Phase 1: Story Development (Weeks 1-4)
- Week 1-2: Story outline and beat sheet
  * Day 1-3: Brainstorming and concept development
  * Day 4-7: First draft outline
  * Day 8-10: Review and revisions
  * Day 11-14: Final outline approval
  * Buffer: 3 days for stakeholder feedback

[Continues with detailed breakdown...]

RISK MITIGATION:
- Built-in review cycles every 2 weeks
- Stakeholder approval gates at phase transitions
- 20% time buffer for unexpected revisions
```

#### For "Resource allocation needs clarification"

```
RESOURCE ALLOCATION MATRIX - Story Department

PERSONNEL ALLOCATION:
┌─────────────────────┬──────────┬─────────┬──────────────┬─────────────┐
│ Role                │ Quantity │ Hours/Wk│ Weeks Needed │ Total Hours │
├─────────────────────┼──────────┼─────────┼──────────────┼─────────────┤
│ Story Lead          │    1     │   40    │     10       │     400     │
│ Story Writers       │    2     │   35    │      8       │     560     │
│ Story Editors       │    1     │   20    │      6       │     120     │
└─────────────────────┴──────────┴─────────┴──────────────┴─────────────┘

BUDGET BREAKDOWN:
- Personnel: $85,000
- Software/Tools: $2,500
- Research Materials: $1,500
- Contingency (15%): $13,350
TOTAL: $102,350
```

## UI Components

### AI Enhancement Button

Located in the evaluation summary section when expanded:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleAIEnhancement}
  disabled={isEnhancing || isLoading}
  className="gap-2 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20"
>
  <Sparkles className="h-4 w-4" />
  AI Enhance
</Button>
```

### Loading States

- Spinner animation during processing
- Toast notification: "AI is analyzing the evaluation..."
- Success toast: "Added X items to gather database. Re-evaluating..."
- Auto-triggers re-evaluation after completion

## Files Modified/Created

- ✅ `src/components/project-readiness/DepartmentCard.tsx` - Added AI button
- ✅ `src/app/api/v1/project-readiness/[projectId]/department/[departmentId]/enhance/route.ts` - API route
- ✅ `src/lib/evaluation/evaluation-enhancer.ts` - Core enhancement logic

## Best Practices

1. **Use After First Evaluation** - Let the system identify issues first
2. **Review Generated Content** - Check the gather page to see what was created
3. **Iterate as Needed** - Run multiple times to progressively improve
4. **Monitor Ratings** - Watch how ratings improve with each enhancement
5. **Avoid Spam** - Wait for re-evaluation to complete before enhancing again

## Troubleshooting

### Same Issues Keep Appearing

**Cause**: AI is generating similar content or not addressing root causes

**Solution**:
- Check gather page to see what's being created
- Manually add specific examples of what you want
- The improved prompt now prevents duplicates by showing existing content

### Rating Not Improving

**Cause**: Generated content may not be substantial enough

**Solution**:
- Prompt now requires 300-500 words per deliverable
- Emphasizes concrete, production-ready content
- Includes specific examples and formatting requirements

### Too Many Items Created

**Cause**: AI generating one item per issue/suggestion

**Solution**: This is expected behavior - each issue/suggestion gets a dedicated deliverable

### "Added 0 items to gather" Error

**Cause**: Brain service API was receiving incorrect data structure

**Solution**: Fixed in latest version
- Brain API requires `content` and `projectId` as top-level fields
- Updated `AddNodeRequest` type definition to match actual API
- MongoDB saving works correctly, brain service now receives proper format

**Technical Details**:
```typescript
// ❌ WRONG (old code)
await brainClient.addNode({
  type: 'gather',
  properties: {
    text: content,
    project_id: projectId,  // Wrong location
  }
})

// ✅ CORRECT (fixed)
await brainClient.addNode({
  type: 'gather',
  content: text,      // Top-level field
  projectId: projectId, // Top-level field
  properties: {
    ...metadata
  }
})
```

## Future Enhancements

- [ ] Allow users to specify which issues to address
- [ ] Show preview of generated content before saving
- [ ] Add quality scoring for generated deliverables
- [ ] Support for custom enhancement templates
- [ ] Batch enhancement across multiple departments

