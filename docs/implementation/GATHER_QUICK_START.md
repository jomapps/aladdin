# Gather Page - Quick Start Guide

## 🚀 Getting Started

The Gather page is now implemented and ready to use! This guide will help you get started quickly.

---

## ✅ Prerequisites

All required dependencies are already installed:
- ✅ MongoDB (for gather database)
- ✅ AWS SDK (via @payloadcms/storage-s3)
- ✅ OpenRouter API (for AI processing)
- ✅ Zustand (for state management)
- ✅ date-fns (for date formatting)

---

## 🔧 Configuration

### 1. Environment Variables

Make sure these are set in your `.env` file:

```bash
# MongoDB (Required)
DATABASE_URI_OPEN=mongodb://localhost:27017

# Cloudflare R2 (Required for file uploads)
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-custom-domain.com

# OpenRouter (Already configured)
OPENROUTER_API_KEY=your_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking
OPENROUTER_VISION_MODE=google/gemini-2.5-flash
```

### 2. Start the Application

```bash
npm run dev
```

---

## 📍 Accessing the Gather Page

Navigate to:
```
http://localhost:3000/dashboard/project/[project-id]/gather
```

Replace `[project-id]` with an actual project ID from your database.

---

## 🎯 Features Available Now

### ✅ Implemented Features

1. **View Gather Items**
   - Paginated list (20 items per page)
   - Search across content, summary, and context
   - Sort by: Latest, Oldest, A-Z, Z-A
   - Filter by: Has Image, Has Document

2. **Create Gather Items**
   - Add content via API
   - Automatic AI processing (enrichment, summary, context)
   - File upload support (images and PDFs)

3. **Edit Gather Items**
   - Inline editing
   - Full re-validation on save
   - Content enrichment on update

4. **Delete Gather Items**
   - Hard delete (no confirmation dialog)
   - File references removed (R2 files persist)

5. **File Management**
   - View and download attached files
   - Remove file references
   - Public URL access

### 🚧 Coming Soon

1. **Chat Integration**
   - "Add to Gather" button in chat
   - "Add All to Gather" bulk operation
   - Selection mode for chat messages

2. **Sidebar Integration**
   - "📦 Gather" link in project sidebar
   - Count badge showing number of items

3. **Advanced Features**
   - Duplicate detection with Brain service
   - Conflict resolution UI
   - Department filtering
   - Date range filtering

---

## 📝 API Usage Examples

### Create a Gather Item

```typescript
const response = await fetch('/api/v1/gather/[projectId]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: {
      name: 'Maya',
      age: 28,
      occupation: 'Scientist',
      personality: 'Curious and determined'
    }
  })
})

const result = await response.json()
console.log(result)
// {
//   success: true,
//   item: { _id: '...', summary: '...', context: '...', ... },
//   duplicates: []
// }
```

### Upload a File

```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch(
  '/api/v1/gather/[projectId]/upload?type=image',
  {
    method: 'POST',
    body: formData
  }
)

const result = await response.json()
console.log(result)
// {
//   success: true,
//   publicUrl: 'https://r2.example.com/...',
//   fileName: 'project-gather-1234567890-image.jpg',
//   fileSize: 123456
// }
```

### Fetch Gather Items

```typescript
const response = await fetch(
  '/api/v1/gather/[projectId]?page=1&limit=20&sort=latest&search=Maya'
)

const result = await response.json()
console.log(result)
// {
//   items: [...],
//   total: 23,
//   page: 1,
//   pages: 2,
//   hasMore: true
// }
```

### Update a Gather Item

```typescript
const response = await fetch('/api/v1/gather/[projectId]/[itemId]', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: {
      name: 'Maya',
      age: 30, // Updated
      occupation: 'Lead Scientist' // Updated
    }
  })
})

const result = await response.json()
// Full re-validation and AI processing happens automatically
```

### Delete a Gather Item

```typescript
const response = await fetch('/api/v1/gather/[projectId]/[itemId]', {
  method: 'DELETE'
})

const result = await response.json()
// { success: true, deleted: true }
```

---

## 🧪 Testing the Implementation

### 1. Manual Testing

1. Navigate to the Gather page
2. The page should load with an empty state
3. Use the API to create a test item (see examples above)
4. Verify the item appears in the list
5. Test expand/collapse functionality
6. Test inline editing
7. Test deletion

### 2. API Testing with cURL

```bash
# Create a gather item
curl -X POST http://localhost:3000/api/v1/gather/[projectId] \
  -H "Content-Type: application/json" \
  -d '{"content": {"name": "Test", "description": "Test item"}}'

# Get gather items
curl http://localhost:3000/api/v1/gather/[projectId]

# Get count
curl http://localhost:3000/api/v1/gather/[projectId]/count
```

---

## 🐛 Troubleshooting

### Issue: "Project not found"
**Solution**: Make sure you're using a valid project ID from your database.

### Issue: "Failed to upload file"
**Solution**: Check that R2 environment variables are correctly configured.

### Issue: "AI processing failed"
**Solution**: Verify OpenRouter API key is valid and has sufficient credits.

### Issue: "Database connection error"
**Solution**: Ensure MongoDB is running and DATABASE_URI_OPEN is correct.

---

## 📚 Related Documentation

- [Full Implementation Details](./gather-page-implementation.md)
- [Gather Page Specification](../idea/pages/gather.md)
- [API Reference](../idea/pages/gather.md#-api-endpoints)

---

## 🎉 Next Steps

1. **Test the current implementation**
2. **Configure R2 for file uploads** (if not already done)
3. **Implement chat integration** (Phase 3)
4. **Add sidebar link** (Phase 4)
5. **Integrate Brain service** for duplicate detection (Phase 2)

---

**Status**: ✅ Ready to Use  
**Version**: 1.0.0  
**Last Updated**: January 2025

