# Evaluation Testing - Quick Start

## 🚀 Run Tests in 3 Steps

### 1. Start Dev Server
```bash
pnpm dev
```

### 2. Run Tests
```bash
# Headless mode (fastest)
pnpm test:e2e:evaluation

# UI mode (recommended - see what's happening)
pnpm test:e2e:evaluation:ui

# Headed mode (watch the browser)
pnpm test:e2e:evaluation:headed
```

### 3. View Results
```bash
pnpm exec playwright show-report playwright-report/evaluation
```

---

## ✅ Pre-Test Checklist

- [ ] Dev server running on `http://localhost:3000`
- [ ] Task service online at `https://tasks.ft.tc`
- [ ] Test project exists: `68df4dab400c86a6a8cf40c6`
- [ ] Story department has gather data
- [ ] Story department not yet evaluated (or reset to pending)
- [ ] `NODE_ENV=development` (for auto-login)
- [ ] Playwright browsers installed: `pnpm exec playwright install`

---

## 🎯 What Gets Tested

1. ✅ Auto-login in dev mode
2. ✅ Navigate to gather page
3. ✅ Click "Evaluate" button
4. ✅ Redirect to project-readiness
5. ✅ Evaluation auto-triggers
6. ✅ Task submits to `tasks.ft.tc`
7. ✅ Wait for completion (up to 2 min)
8. ✅ Webhook notification received
9. ✅ Results displayed (rating, summary, issues, suggestions)
10. ✅ Overall score updated

---

## 🐛 Quick Troubleshooting

### Test fails immediately?
```bash
# Check dev server
curl http://localhost:3000

# Check task service
curl https://tasks.ft.tc/api/v1/health

# Seed database
pnpm db:seed
```

### Test times out?
```bash
# Check webhook endpoint
curl https://aladdin.ngrok.pro/api/webhooks/evaluation-complete

# Check environment variables
echo $TASKS_API_URL
echo $TASK_API_KEY
echo $NEXT_PUBLIC_APP_URL
```

### Results not showing?
- Check Next.js console for `[Webhook]` logs
- Check browser console for errors
- Refresh the page manually

---

## 📊 Expected Timeline

| Step | Duration |
|------|----------|
| Auto-login | 2-5s |
| Navigate to gather | 1-2s |
| Click evaluate | 1s |
| Redirect | 1-2s |
| Task submission | 2-5s |
| **AI Evaluation** | **30-120s** |
| Webhook delivery | 1-2s |
| Database update | 1s |
| UI refresh | 1-2s |
| **Total** | **45-180s** |

---

## 🎬 Watch It Run

For the best experience, run in UI mode:

```bash
pnpm test:e2e:evaluation:ui
```

This opens an interactive test runner where you can:
- ⏯️ Play/pause tests
- 🔍 Inspect each step
- 📸 View screenshots
- 🎥 Watch videos
- 🐛 Debug failures

---

## 📝 Test Files

- **Test Spec**: `tests/e2e/evaluation-flow.spec.ts`
- **Config**: `tests/e2e/evaluation.config.ts`
- **Full Guide**: `docs/testing/EVALUATION_TESTING.md`

---

## 🎉 Success Looks Like

```
✓ should complete full evaluation workflow (125s)
✓ should handle evaluation failure gracefully (8s)
✓ should display evaluation history (5s)
✓ should show sequential evaluation requirements (4s)

4 passed (142s)
```

---

## 🆘 Need Help?

1. Read full guide: `docs/testing/EVALUATION_TESTING.md`
2. Check webhook docs: `docs/webhooks/EVALUATION_WEBHOOK.md`
3. Review task service: `celery-redis/docs/how-to-use-celery-redis.md`
4. Check implementation: `docs/celery-redis/need-evaluate-department.md`

---

**Ready? Let's test! 🚀**

```bash
pnpm test:e2e:evaluation:ui
```

