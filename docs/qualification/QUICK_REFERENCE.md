# Qualification Departments - Quick Reference

## 🚀 Quick Start

```typescript
import { worldDepartment, storyDepartment } from '@/lib/qualification'

// Process world data → story bible
const storyBible = await worldDepartment.processWorldData(
  projectId,
  projectSlug,
  userId
)

// Generate screenplay + scenes
const { screenplay, scenes } = await storyDepartment.processStory(
  projectId,
  projectSlug,
  userId
)
```

## 📊 Data Flow

```
Gather DB (raw)
    ↓
World Dept → Story Bible
    ↓
Qualified DB + PayloadCMS + Brain Service
    ↓
Story Dept → Screenplay + Scenes
    ↓
PayloadCMS (scenes collection)
```

## 🔧 Key Functions

### World Department
```typescript
worldDepartment.processWorldData(projectId, projectSlug, userId)
// Returns: StoryBible with world rules, timeline, themes, locations
```

### Story Department
```typescript
storyDepartment.processStory(projectId, projectSlug, userId)
// Returns: { screenplay: Screenplay, scenes: Scene[] }

breakScreenplayIntoScenes(screenplay, storyBible)
// Returns: Scene[] with camera/lighting direction
```

## 📝 Output Structures

### Story Bible
```typescript
{
  title: string
  worldRules: [{ ruleName, category, description, priority }]
  timeline: [{ eventName, timestamp, description, importance }]
  themes: [{ theme, visualMotifs, colorAssociations }]
  locations: [{ locationName, description, atmosphere }]
  consistencyRules: [{ ruleName, category, enforcement }]
  visualStyleGuide: { primaryStyle, colorPalette, artDirection }
}
```

### Scene
```typescript
{
  sceneNumber: "001"
  expectedDuration: 5  // seconds
  screenplayText: "EXT. MARKETPLACE - DAY..."
  dramaticEffect: {
    intensity: 7        // 0-10
    emotionalTone: "tense"
    pacing: "fast"
    narrativeFunction: "Establish conflict"
  }
  cameraDirection: {
    shotType: "close-up"
    movement: "tracking"
    angle: "low-angle"
  }
  lightingDirection: {
    style: "dramatic"
    mood: "dark"
    colorTemperature: "cool"
  }
}
```

## 🗄️ Storage Locations

| Data | Qualified DB | PayloadCMS | Brain Service |
|------|-------------|------------|---------------|
| Story Bible | ✓ story_bible | ✓ story-bible | ✓ semantic search |
| Screenplay | ✓ screenplays | - | - |
| Scenes | - | ✓ scenes | - |

## 🔑 Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
DATABASE_URI=mongodb://...
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=...
```

## ⚡ Performance

- World Dept: ~10-15s
- Story Dept: ~20-30s
- Total: ~30-45s
- Cost: ~$0.10-0.20

## 🎯 Next Steps

1. Call `worldDepartment.processWorldData()` first
2. Then call `storyDepartment.processStory()`
3. Scenes are auto-created in PayloadCMS
4. Query scenes for video generation

## 📚 Full Docs

- Implementation: `/docs/qualification/README.md`
- Usage Guide: `/docs/qualification/USAGE.md`
- Types: `/src/lib/qualification/types.ts`
