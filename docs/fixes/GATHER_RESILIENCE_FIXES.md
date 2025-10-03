# Gather Save Resilience Fixes

## 🛡️ Additional Issues Fixed

### Issue: AI Processing Failures Causing Complete Save Failure
**Problem**: When LLM service returns 400 errors, the entire gather save fails
**Impact**: Users cannot save messages even though the database is working

### Fixes Applied:

#### 1. AI Processing Resilience (`src/lib/gather/aiProcessor.ts`)

Added graceful fallbacks for each AI processing step:

```typescript
// ✅ Enrichment with fallback
try {
  enrichmentResult = await this.enrichContent(enrichedContent, projectContext)
} catch (error) {
  console.error('[GatherAI] Enrichment failed, using original content:', error)
  enrichmentResult = { enrichedContent: content, isComplete: true, iterationCount: 0 }
}

// ✅ Summary with fallback
try {
  summary = await this.generateSummary(enrichedContent)
} catch (error) {
  console.error('[GatherAI] Summary generation failed, using fallback:', error)
  summary = typeof content === 'string'
    ? content.substring(0, 100) + (content.length > 100 ? '...' : '')
    : 'Content summary'
}

// ✅ Context with fallback
try {
  context = await this.generateContext(enrichedContent, projectContext)
} catch (error) {
  console.error('[GatherAI] Context generation failed, using fallback:', error)
  context = 'AI processing temporarily unavailable - content stored as-is'
}

// ✅ Duplicate check with fallback
try {
  duplicates = await this.checkDuplicates(enrichedContent, summary, projectId)
} catch (error) {
  console.error('[GatherAI] Duplicate check failed, skipping:', error)
  duplicates = []
}
```

**Result**: Messages can now be saved even when:
- LLM service is down
- LLM returns 400/500 errors
- Brain service is unavailable for duplicate check

---

#### 2. Brain Search Endpoint Fallback (`src/lib/brain/client.ts`)

Added automatic fallback when `/api/v1/search` endpoint doesn't exist:

```typescript
async searchSimilar(query: SearchSimilarQuery): Promise<SearchSimilarResult[]> {
  try {
    // Try /api/v1/search first (hybrid search)
    const response = await this.axiosInstance.post('/api/v1/search', { /* ... */ })
    return transformedResults
  } catch (error: any) {
    // If 404, fall back to semanticSearch
    if (error.response?.status === 404) {
      console.warn('[BrainClient] /api/v1/search not found, using semanticSearch fallback')
      return this.semanticSearch({ /* ... */ })
    }
    throw this.handleError(error, 'searchSimilar')
  }
}
```

**Result**: Duplicate detection works even if Brain service has different endpoint structure

---

## 🎯 Behavior Matrix

### Before Fixes:
| Scenario | Result |
|----------|--------|
| LLM fails | ❌ Complete save failure |
| Brain search 404 | ❌ Complete save failure |
| No AI processing | ❌ MongoDB validation error |

### After Fixes:
| Scenario | Result |
|----------|--------|
| LLM fails | ✅ Saves with fallback summary/context |
| Brain search 404 | ✅ Falls back to semanticSearch |
| No AI processing | ✅ Saves with minimal valid data |

---

## 📋 Error Logs Explained

### LLM 400 Errors (Now Handled):
```
[LLMClient] Attempt 1 failed: Request failed with status code 400
[GatherAI] Summary generation failed, using fallback: ...
```
**Action**: Saves message with simple summary (first 100 chars of content)

### Brain 404 Errors (Now Handled):
```
[BrainClient] /api/v1/search not found, using semanticSearch fallback
[GatherAI] Duplicate check failed, skipping: ...
```
**Action**: Skips duplicate detection, saves message anyway

### MongoDB Validation (Now Prevented):
```
Previously: Document failed validation (missing summary/context)
Now: Always provides valid summary and context, even if AI fails
```

---

## 🧪 Testing Resilience

### Test 1: LLM Service Down
```bash
# Temporarily break LLM by using wrong API key
OPENROUTER_API_KEY=invalid npm run dev

# Then try to save a message
# Expected: Saves with fallback summary/context
```

### Test 2: Brain Service Unavailable
```bash
# Temporarily disable Brain by using wrong URL
BRAIN_SERVICE_BASE_URL=http://invalid npm run dev

# Then try to save a message
# Expected: Saves without duplicate check, brain.saved = false
```

### Test 3: Both Services Down
```bash
# Both invalid
OPENROUTER_API_KEY=invalid
BRAIN_SERVICE_BASE_URL=http://invalid

# Expected: Still saves with minimal data:
# - summary: first 100 chars
# - context: "AI processing temporarily unavailable"
# - brain.saved: false
```

---

## 📊 Fallback Data Structure

When AI processing fails, messages are saved with:

```typescript
{
  summary: content.substring(0, 100) + "...",  // First 100 chars
  context: "AI processing temporarily unavailable - content stored as-is",
  extractedText: undefined,  // Only if image/doc processing worked
  iterationCount: 0,
  duplicates: [],  // Empty if duplicate check failed
  enrichedContent: content,  // Original content unchanged
}
```

MongoDB validation passes because all required fields are present.

---

## 🔧 Configuration Changes

### None Required
All fixes are automatic fallbacks. No configuration changes needed.

### Environment Variables (Same as Before)
```bash
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your_api_key
OPENROUTER_API_KEY=your_api_key
```

---

## 🚨 Monitoring Recommendations

### Watch These Logs:

1. **AI Fallbacks** (indicates LLM issues):
```
[GatherAI] Summary generation failed, using fallback
[GatherAI] Context generation failed, using fallback
```

2. **Brain Fallbacks** (indicates Brain issues):
```
[BrainClient] /api/v1/search not found, using semanticSearch fallback
[GatherAI] Duplicate check failed, skipping
```

3. **Successful AI Processing**:
```
[Gather API] ✅ Stored in Brain service: [id]
```

### Set Up Alerts For:
- High rate of AI fallbacks (> 50% of saves)
- Brain service consistently returning 404
- MongoDB validation errors (should be zero now)

---

## 📈 Service Health Dashboard

Create a monitoring endpoint to track:

```typescript
GET /api/v1/gather/health
{
  llm: {
    available: boolean,
    lastError: string,
    fallbackRate: number  // % of saves using fallback
  },
  brain: {
    available: boolean,
    lastError: string,
    searchEndpoint: "/api/v1/search" | "/api/v1/search/semantic"
  },
  gather: {
    totalSaves: number,
    successfulAIProcessing: number,
    fallbackSaves: number
  }
}
```

---

## ✅ Summary

**All gather saves now succeed regardless of**:
- ✅ LLM service availability
- ✅ Brain service availability
- ✅ AI processing errors
- ✅ Network issues

**Users will always be able to save messages**, with graceful degradation:
- Best case: Full AI enhancement + Brain save
- Fallback: Basic summary/context + DB save only
- Worst case: Minimal data + DB save only

**Zero data loss** - every message is preserved.
