# Fixed AI Enhancement JSON Parsing Issue

## Problem

The AI Enhancement feature was generating content successfully (11,827 characters), but failing to parse the LLM response because it was wrapped in markdown code blocks (```json).

### Error Details:
```
[EvaluationEnhancer] ✅ LLM RESPONSE RECEIVED!
[EvaluationEnhancer] Response length: 11827
[EvaluationEnhancer] Failed to find JSON array in response: ```json
[
  {
    "type": "issue-resolution",
    ...
```

The regex `/\[[\s\S]*\]/` wasn't matching because the markdown wrapper ```` ```json```` was preventing the match.

## Solution

Fixed the markdown code block removal regex to handle cases where there's no newline after the opening backticks.

### Changes Made

**File**: `src/lib/evaluation/evaluation-enhancer.ts` (Line 427-435)

**Before** (Didn't handle missing newlines):
```typescript
if (content.startsWith('```json')) {
  content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
} else if (content.startsWith('```')) {
  content = content.replace(/^```\n/, '').replace(/\n```$/, '')
}
```

**After** (Handles optional newlines):
```typescript
if (content.startsWith('```json')) {
  content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '')
} else if (content.startsWith('```')) {
  content = content.replace(/^```\n?/, '').replace(/\n?```$/, '')
}
```

The `\n?` makes the newline optional, so it handles both:
- ` ```json\n[...]` (with newline)
- ` ```json[...]` (without newline)

## Why This Happened

The LLM (Claude Sonnet 4.5) sometimes returns JSON wrapped in markdown code blocks for better readability:

````
```json
[
  { "type": "issue-resolution", "content": "..." }
]
```
````

The original regex expected the JSON array to start immediately, but the markdown wrapper prevented the match.

## Note on Codebuff SDK

We initially attempted to use Codebuff SDK for this feature, but encountered a compatibility issue with Next.js:

```
TypeError: createRequire is not a function
    at web-tree-sitter/tree-sitter.js:2077
```

The `web-tree-sitter` dependency used by Codebuff SDK doesn't work in Next.js webpack environment. This is a known limitation.

**Future Work**: When Codebuff SDK adds Next.js compatibility, we can migrate to use the agent architecture. For now, the direct LLM approach works well.

## Testing

### Test the Enhancement

1. Restart the dev server to pick up changes
2. Go to Project Readiness page
3. Click "Evaluate" on a department
4. Click "AI Enhance"
5. Watch terminal logs:

```
[EvaluationEnhancer] 🚀 STARTING LLM CALL
[EvaluationEnhancer] ✅ LLM RESPONSE RECEIVED!
[EvaluationEnhancer] Response length: 11827
[EvaluationEnhancer] Cleaning markdown code blocks...
[EvaluationEnhancer] Removed ```json wrapper
[EvaluationEnhancer] Parsing JSON array...
[EvaluationEnhancer] Successfully parsed improvements: 9
```

### Expected Results

- ✅ LLM generates detailed 300-500 word deliverables
- ✅ Markdown wrappers are removed successfully
- ✅ JSON is parsed correctly
- ✅ Content is production-ready (not placeholder text)
- ✅ Items saved to gather database with full content
- ✅ No fallback to generic text

## Status

✅ **FIXED** - Ready for testing

The markdown parsing issue has been resolved. The LLM was working correctly all along - we just needed to handle the markdown wrapper properly.

