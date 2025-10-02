# OpenRouter Quick Start Guide

## ✅ Implementation Complete!

Your @codebuff/sdk agents can now use **any OpenRouter model**. The integration is already implemented and ready to use!

## 🚀 How to Enable OpenRouter (2 Steps)

### Step 1: Update Your `.env` File

Your `.env` **already has** these variables, just ensure `OPENROUTER_BASE_URL` is set:

```bash
# OpenRouter Configuration (for @codebuff/sdk)
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # ← MUST be set to enable OpenRouter
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
```

### Step 2: Restart Your Application

```bash
npm run dev
```

That's it! 🎉

## ✅ Verification

When you start the app, you should see:

```
🌐 AladdinAgentRunner using OpenRouter at https://openrouter.ai/api/v1
🌐 AgentPool using OpenRouter at https://openrouter.ai/api/v1
🌐 Orchestrator using OpenRouter at https://openrouter.ai/api/v1
```

If you see this instead:
```
🤖 Using direct Anthropic API
```

Then `OPENROUTER_BASE_URL` is not set in your `.env` file.

## 📊 What Changed

### Code Updates (Already Done ✅)
1. **src/lib/agents/AladdinAgentRunner.ts** - Auto-detects OpenRouter
2. **src/lib/agents/agentPool.ts** - Uses OpenRouter when configured
3. **src/lib/agents/orchestrator.ts** - Routes through OpenRouter

### Detection Logic
```typescript
// Automatic OpenRouter detection
const useOpenRouter = !!process.env.OPENROUTER_BASE_URL

// If OPENROUTER_BASE_URL exists → Use OpenRouter
// If not → Use direct Anthropic API
```

## 🎯 Available Models

With OpenRouter enabled, your agents can use:

### Anthropic (Premium Quality)
- `anthropic/claude-sonnet-4.5` ← Current default
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-opus-4`

### Google (Vision & Speed)
- `google/gemini-2.5-flash` ← Vision tasks
- `google/gemini-pro-1.5`

### Open Source (Cost-Effective)
- `qwen/qwen3-vl-235b-a22b-thinking` ← Current backup
- `meta-llama/llama-3.3-70b`
- `mistralai/mistral-large`

### OpenAI (Alternative)
- `openai/gpt-4o`
- `openai/gpt-4-turbo`

## 💰 Cost Comparison

| Scenario | Direct Anthropic | With OpenRouter |
|----------|-----------------|-----------------|
| **Claude Sonnet 4.5** | $3/$15 per 1M | $3/$15 per 1M (same) |
| **Qwen Backup** | Not available | $0.20/$0.60 per 1M |
| **Gemini Flash** | Not available | $0.15/$0.60 per 1M |
| **Billing** | Separate invoice | Unified invoice |

**Savings**: Using Qwen for 8 coordination agents = **90% cost reduction** on those tasks!

## 🧪 Testing

### Test Agent Execution

```bash
# Make a test request
curl -X POST http://localhost:3000/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "story-head-001",
    "prompt": "Write a one-sentence story premise"
  }'
```

### Monitor OpenRouter Dashboard

1. Visit https://openrouter.ai/activity
2. You should see API calls appearing
3. Verify models being used match your agent configurations
4. Check costs and token usage

## ❓ FAQ

### Q: Do I need to change my agent models?
**A:** No! They're already using OpenRouter format (`anthropic/claude-sonnet-4.5`). We updated them earlier.

### Q: Can I switch back to direct Anthropic?
**A:** Yes! Just remove or comment out `OPENROUTER_BASE_URL` from `.env`:
```bash
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  ← Comment this out
```

### Q: Can I use both OpenRouter and direct API?
**A:** Not simultaneously. The system auto-detects based on `OPENROUTER_BASE_URL`. Pick one.

### Q: What if a model isn't available on OpenRouter?
**A:** OpenRouter supports 200+ models. Check https://openrouter.ai/models for the full list.

### Q: How do I switch individual agents to different models?
**A:** Update the agent's `model` field in PayloadCMS admin or seed data. Use OpenRouter format: `provider/model-name`

## 🐛 Troubleshooting

### Issue: "Model not found"
```
Error: Model 'claude-sonnet-4.5' not found
```

**Solution**: Model name must use OpenRouter format
```typescript
// ❌ Wrong
model: 'claude-sonnet-4.5'

// ✅ Correct
model: 'anthropic/claude-sonnet-4.5'
```

### Issue: "Invalid API key"
```
Error: Unauthorized
```

**Solution**: Verify `OPENROUTER_API_KEY` in `.env` is correct and active.

### Issue: Console shows "Using direct Anthropic API"
```
🤖 Using direct Anthropic API
```

**Solution**: Set `OPENROUTER_BASE_URL` in `.env`:
```bash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Issue: High latency
**Solution**: Try faster models:
```typescript
// Slower
model: 'anthropic/claude-opus-4'

// Faster
model: 'google/gemini-2.5-flash'
model: 'anthropic/claude-sonnet-4.5'
```

## 📚 Related Documentation

- **[OPENROUTER_INTEGRATION.md](./OPENROUTER_INTEGRATION.md)** - Detailed technical guide
- **[MODEL_UPDATE_SUMMARY.md](./MODEL_UPDATE_SUMMARY.md)** - Model update history
- **[decision-tree.md](./idea/decision-tree.md)** - Agent workflow with models

## 🎉 Summary

✅ **OpenRouter integration is complete and ready to use**
✅ **All 35 agents configured with correct model format**
✅ **Auto-detection based on environment variables**
✅ **Detailed logging shows which API is active**
✅ **Full backward compatibility maintained**

Just set `OPENROUTER_BASE_URL` in your `.env` and restart! 🚀

---

**Need help?** Check the [full integration guide](./OPENROUTER_INTEGRATION.md) or review the [troubleshooting section](#-troubleshooting) above.
