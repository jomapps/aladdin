# Last Frame Service - API Usage Guide

A comprehensive guide for external programs to integrate with the Last Frame Service API.

## 🚀 Service Overview

The Last Frame Service provides six main features with enhanced reliability (v3.2):
1. **Last Frame Extraction** - Extract the final frame from a video as an image
2. **Video Stitching** - Combine multiple videos into a single output video
3. **Audio Stitching** - Combine multiple audio files with support for silence gaps
4. **Music Track Mixing** - Mix videos with background music using intelligent audio ducking
5. **Video+Audio Assembly** - Combine scene videos with master audio and generate 3 output files
6. **Media Length Detection** - Determine the duration of audio or video files with millisecond precision

## 🌐 Service Endpoints

**Production URL:** `https://last-frame.ft.tc` (recommended)
**Alternative URL:** `http://last-frame.ft.tc` (HTTP only)
**Local Development:** `http://localhost:8000`

**Note:** The service is deployed with PM2 and Nginx, providing high availability and automatic restarts.

**Recent Improvements (v3.2):**
- ✅ Fixed critical Redis synchronization issues
- ✅ Enhanced task queue reliability
- ✅ Modular architecture for better maintainability
- ✅ 100% consistent task status tracking
- ✅ Production deployment with PM2 and Nginx
- ✅ SSL/HTTPS support (when configured)

## 🔐 Authentication

All API requests require authentication using a Bearer token in the Authorization header:

```http
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**Important:** Replace the API key above with your actual API key. The key is stored securely in the server's `.env` file.

### Getting Your API Key

If you're a system administrator, you can find the API key in:
```bash
# View the API key
grep API_KEY /var/www/last-frame/.env
```

For external developers, contact your system administrator to obtain an API key.

## 🚦 Quick Start

### 1. Test the Service

First, verify the service is running:

```bash
curl https://last-frame.ft.tc/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T05:42:12.210477",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "gpu": "unavailable"
  }
}
```

### 2. Make Your First Request

Try extracting the last frame from a video:

```bash
curl -X POST "https://last-frame.ft.tc/api/v1/process" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/sample-video.mp4"
  }'
```

### 3. Check Task Status

Use the returned `task_id` to check progress:

```bash
curl "https://last-frame.ft.tc/api/v1/status/{task_id}" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67"
```

## 🏗️ Production Infrastructure

The service is deployed with:
- **Process Manager:** PM2 (auto-restart, monitoring)
- **Web Server:** Nginx (reverse proxy, load balancing)
- **Database:** MongoDB (persistent storage)
- **Cache/Queue:** Redis (task queue, caching)
- **Video Processing:** FFmpeg (media processing)
- **Storage:** Cloudflare R2 (S3-compatible object storage)

**High Availability Features:**
- ✅ Automatic restart on failure
- ✅ Auto-start on server boot
- ✅ Process monitoring with PM2
- ✅ Nginx reverse proxy with health checks
- ✅ Redis-based task queue for reliability
- ✅ Comprehensive error logging

## 📋 API Endpoints

### Health Check
Check if the service is operational:

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T11:27:30.348141",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "gpu": "available"
  }
}
```

### Root Endpoint
Get basic service information:

```http
GET /
```

**Response:**
```json
{
  "service": "Last Frame Extractor",
  "version": "1.0.0",
  "status": "running",
  "uptime": 3600
}
```

---

## ⏱️ Media Length Detection

### Submit Media Length Detection Job

Detect the duration and metadata of audio or video files with millisecond precision.

```http
POST https://last-frame.ft.tc/api/v1/length
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "media_url": "https://example.com/video.mp4",
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Parameters:**
- `media_url` (required): URL of the audio or video file to analyze
- `webhook_url` (optional): URL to receive completion notifications

**Response:**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "pending",
  "message": "Media length detection queued successfully"
}
```

### Example Code (Python)

```python
import requests
import time

# Submit media length detection job
url = "https://last-frame.ft.tc/api/v1/length"
headers = {
    "Authorization": "Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67",
    "Content-Type": "application/json"
}
data = {
    "media_url": "https://v3.fal.media/files/kangaroo/aGI3zrC6V_vNNng-4_od9_speech.mp3"
}

response = requests.post(url, json=data, headers=headers)
task_data = response.json()
task_id = task_data["task_id"]

# Poll for completion
status_url = f"https://last-frame.ft.tc/api/v1/status/{task_id}"
while True:
    status_response = requests.get(status_url, headers=headers)
    status_data = status_response.json()

    if status_data["status"] == "completed":
        metadata = status_data["metadata"]
        duration = metadata["media_duration"]
        media_type = metadata["media_type"]
        print(f"Media duration: {duration} seconds")
        print(f"Media type: {media_type}")
        print(f"Format: {metadata.get('media_format', 'unknown')}")
        break
    elif status_data["status"] == "failed":
        print(f"Task failed: {status_data.get('error_message')}")
        break

    time.sleep(2)  # Check every 2 seconds
```

### Response Metadata

When the length detection task completes, the response includes detailed metadata:

```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "completed",
  "media_url": "https://example.com/sample.mp4",
  "metadata": {
    "media_duration": 125.847,
    "media_type": "video",
    "media_format": "mov,mp4,m4a,3gp,3g2,mj2",
    "media_codec": "h264",
    "media_bitrate": 2500000,
    "video_resolution": "1920x1080",
    "file_size": 39428571,
    "processing_time": 0.234
  },
  "created_at": "2025-01-17T10:30:00.000Z",
  "completed_at": "2025-01-17T10:30:00.234Z"
}
```

**Metadata Fields:**
- `media_duration`: Duration in seconds with millisecond precision
- `media_type`: "video", "audio", or "unknown"
- `media_format`: Container format detected by FFmpeg
- `media_codec`: Primary codec used (video codec for videos, audio codec for audio-only)
- `media_bitrate`: Bitrate in bits per second (if available)
- `video_resolution`: Video dimensions in "WIDTHxHEIGHT" format (video only)
- `media_sample_rate`: Audio sample rate in Hz (audio streams)
- `file_size`: File size in bytes
- `processing_time`: Time taken to analyze the file in seconds

### Supported Media Formats

The length detection service supports all media formats that FFmpeg can process, including:

**Video Formats:**
- MP4, MOV, AVI, MKV, WebM, FLV, WMV, 3GP
- MPEG-1, MPEG-2, MPEG-4
- QuickTime, OGV

**Audio Formats:**
- MP3, WAV, AAC, FLAC, OGG
- M4A, WMA, AIFF, AU
- Opus, Vorbis

**Codecs:**
- Video: H.264, H.265/HEVC, VP8, VP9, AV1, MPEG-4, etc.
- Audio: AAC, MP3, FLAC, PCM, Opus, Vorbis, etc.

---

## 🎬 Video Stitching

### Submit Video Stitch Job

Combine multiple videos into a single output video.

```http
POST https://last-frame.ft.tc/api/v1/stitch
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "video_urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4",
    "https://example.com/video3.mp4"
  ],
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Parameters:**
- `video_urls` (required): Array of video URLs to stitch together (minimum 2 videos)
- `webhook_url` (optional): URL to receive completion notifications

**Response:**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "pending",
  "message": "Video stitch queued successfully"
}
```

### Example Code (Python)

```python
import requests
import time

# Submit video stitch job
url = "https://last-frame.ft.tc/api/v1/stitch"
headers = {
    "Authorization": "Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67",
    "Content-Type": "application/json"
}
data = {
    "video_urls": [
        "https://example.com/video1.mp4",
        "https://example.com/video2.mp4"
    ]
}

response = requests.post(url, json=data, headers=headers)
task_data = response.json()
task_id = task_data["task_id"]

# Poll for completion
status_url = f"https://last-frame.ft.tc/api/v1/status/{task_id}"
while True:
    status_response = requests.get(status_url, headers=headers)
    status_data = status_response.json()

    if status_data["status"] == "completed":
        video_url = status_data["video_result_url"]
        print(f"Stitched video ready: {video_url}")
        break
    elif status_data["status"] == "failed":
        print(f"Task failed: {status_data.get('error_message')}")
        break

    time.sleep(5)  # Check every 5 seconds
```

---

## 🎵 Audio Stitching

### Submit Audio Stitch Job

Stitch multiple audio sources together with silence insertion support. You can mix actual audio URLs with silence segments using the `empty:${duration}` format.

```http
POST /api/v1/audio-stitch
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "audio_urls": [
    "https://example.com/audio1.mp3",
    "empty:2.5",
    "https://example.com/audio2.wav",
    "empty:1.0",
    "https://example.com/audio3.mp3"
  ],
  "webhook_url": "https://your-app.com/webhook" // Optional
}
```

**Response:**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "pending",
  "message": "Audio stitch queued successfully"
}
```

### Audio Source Formats

- **Audio URLs**: Direct links to audio files (MP3, WAV, AAC, etc.)
- **Silence**: Use `empty:${duration}` format where duration is in seconds
  - Examples: `empty:1.5`, `empty:0.5`, `empty:10.0`
  - Maximum silence duration: 3600 seconds (1 hour)
  - Minimum silence duration: 0.1 seconds

### Example Code (Python)

```python
import requests
import time

# Submit audio stitch job
url = "https://last-frame.ft.tc/api/v1/audio-stitch"
headers = {
    "Authorization": "Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67",
    "Content-Type": "application/json"
}
data = {
    "audio_urls": [
        "https://example.com/intro.mp3",
        "empty:2.0",  # 2 seconds of silence
        "https://example.com/main.wav",
        "empty:1.5",  # 1.5 seconds of silence
        "https://example.com/outro.mp3"
    ]
}

response = requests.post(url, json=data, headers=headers)
task_data = response.json()
task_id = task_data["task_id"]

# Poll for completion
status_url = f"https://last-frame.ft.tc/api/v1/status/{task_id}"
while True:
    status_response = requests.get(status_url, headers=headers)
    status_data = status_response.json()
    
    if status_data["status"] == "completed":
        audio_url = status_data["audio_result_url"]
        print(f"Stitched audio ready: {audio_url}")
        
        # Display processing metadata
        metadata = status_data.get("metadata", {})
        print(f"Total sources: {metadata.get('total_audio_sources')}")
        print(f"Silence duration: {metadata.get('total_silence_duration')}s")
        print(f"Output duration: {metadata.get('output_audio_duration')}s")
        print(f"File size: {metadata.get('output_audio_file_size')} bytes")
        break
    elif status_data["status"] == "failed":
        print(f"Task failed: {status_data.get('error_message')}")
        break
    
    time.sleep(5)  # Check every 5 seconds
```

### Use Cases

- **Podcast Production**: Stitch intro, content segments, and outro with silence gaps
- **Audio Presentations**: Combine speech segments with pauses for emphasis
- **Music Compilation**: Create playlists with silence between tracks
- **Audio Testing**: Generate test sequences with known silence durations

---

## 🎵 Music Track Mixing

### Submit Music Track Job

Mix a video with a music track, applying audio ducking to balance the original video audio with the background music.

```http
POST /api/v1/music-track
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "video_url": "https://example.com/video.mp4",
  "music_url": "https://example.com/background_music.mp3",
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Parameters:**
- `video_url` (required): URL of the video to process
- `music_url` (required): URL of the music track to mix with the video
- `webhook_url` (optional): URL to receive completion notifications

**Response:**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "pending",
  "message": "Music track mixing queued successfully"
}
```

### Audio Ducking Process

The music track mixing service applies intelligent audio ducking:
1. **Analysis Phase**: Detect audio levels in the original video
2. **Ducking Phase**: Automatically reduce music volume when video audio is present
3. **Mixing Phase**: Combine the ducked music with the original video audio
4. **Output Phase**: Generate final video with mixed audio track

### Example Code (Python)

```python
import requests
import time

# Submit music track mixing job
url = "https://last-frame.ft.tc/api/v1/music-track"
headers = {
    "Authorization": "Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67",
    "Content-Type": "application/json"
}
data = {
    "video_url": "https://example.com/presentation.mp4",
    "music_url": "https://example.com/background_music.mp3"
}

response = requests.post(url, json=data, headers=headers)
task_data = response.json()
task_id = task_data["task_id"]

# Poll for completion
status_url = f"https://last-frame.ft.tc/api/v1/status/{task_id}"
while True:
    status_response = requests.get(status_url, headers=headers)
    status_data = status_response.json()
    
    if status_data["status"] == "completed":
        video_url = status_data["video_result_url"]
        print(f"Mixed video ready: {video_url}")
        
        # Display processing metadata
        metadata = status_data.get("metadata", {})
        print(f"Original duration: {metadata.get('original_duration')}s")
        print(f"Music duration: {metadata.get('music_duration')}s")
        print(f"Processing time: {metadata.get('processing_time')}s")
        break
    elif status_data["status"] == "failed":
        print(f"Task failed: {status_data.get('error_message')}")
        break
    
    time.sleep(5)  # Check every 5 seconds
```

### Use Cases

- **Presentations**: Add background music to video presentations
- **Social Media**: Enhance videos with trending music tracks
- **Marketing**: Create promotional videos with branded audio
- **Education**: Add ambient music to instructional videos

---

## 🎬 Video+Audio Assembly

### Submit Video+Audio Assembly Job

Combine multiple scene videos with a master audio track to create a final movie. Generates 3 output files: full video, video-only, and audio-only.

```http
POST /api/v1/video/assemble-movie
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "project_id": "689888ad3f2c72ce8518337a",
  "scene_videos": [
    {
      "scene_id": "scene_001",
      "video_url": "https://example.com/scene1.mp4",
      "sequence_number": 1,
      "expected_duration": 45.5
    },
    {
      "scene_id": "scene_002",
      "video_url": "https://example.com/scene2.mp4",
      "sequence_number": 2,
      "expected_duration": 38.2
    }
  ],
  "master_audio": {
    "audio_url": "https://example.com/master_audio.mp3",
    "expected_duration": 83.7
  },
  "output_settings": {
    "quality": "high",
    "format": "mp4",
    "resolution": "1080p",
    "include_audio": true,
    "audio_sync_mode": "stretch_to_fit"
  },
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Parameters:**
- `project_id` (required): Unique project identifier
- `scene_videos` (required): Array of scene video objects in sequence order
- `master_audio` (required): Master audio track information
- `output_settings` (optional): Output configuration settings
- `webhook_url` (optional): Webhook URL for completion notifications

**Response:**
```json
{
  "task_id": "04c428bdde6b4c3b96138f2d4fcbbb62",
  "status": "pending",
  "estimated_processing_time": 125,
  "total_scenes": 2
}
```

---

## 📸 Last Frame Extraction

### Submit Last Frame Job

Extract the final frame from a video as a JPEG image.

```http
POST /api/v1/process
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "video_url": "https://example.com/video.mp4",
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Parameters:**
- `video_url` (required): URL of the video to process
- `webhook_url` (optional): URL to receive completion notifications

**Response:**
```json
{
  "task_id": "68932ab1f918707cd6188d5f",
  "status": "pending",
  "message": "Video processing queued successfully"
}
```

### Example Code (JavaScript)

```javascript
async function extractLastFrame(videoUrl) {
    const response = await fetch('https://last-frame.ft.tc/api/v1/process', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            video_url: videoUrl
        })
    });
    
    const taskData = await response.json();
    const taskId = taskData.task_id;
    
    // Poll for completion
    while (true) {
        const statusResponse = await fetch(
            `https://last-frame.ft.tc/api/v1/status/${taskId}`,
            {
                headers: {
                    'Authorization': 'Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67'
                }
            }
        );
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
            return statusData.image_url;
        } else if (statusData.status === 'failed') {
            throw new Error(statusData.error_message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}
```

---

## 📊 Task Status Monitoring

### Check Task Status

Monitor the progress of any submitted task:

**For Last Frame and Video Stitch tasks:**
```http
GET /api/v1/status/{task_id}
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**For Video+Audio Assembly tasks:**
```http
GET /api/v1/video/assembly/{task_id}
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**Response for Video Stitch (Completed):**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "completed",
  "video_urls": [
    "https://example.com/video1.mp4",
    "https://example.com/video2.mp4"
  ],
  "video_result_url": "https://media.rumbletv.com/68933d660fbe479408b185f1.mp4",
  "created_at": "2025-08-06T11:32:54.156000",
  "completed_at": "2025-08-06T11:32:58.181000",
  "metadata": {
    "total_videos": 2,
    "total_duration": 10.5,
    "output_duration": 10.5,
    "processing_time": 4.03,
    "output_file_size": 2048576
  }
}
```

**Response for Video+Audio Assembly (Completed):**
```json
{
  "task_id": "04c428bdde6b4c3b96138f2d4fcbbb62",
  "status": "completed",
  "project_id": "test_local_assembly_123",
  "full_video_url": "https://media.rumbletv.com/final_movie_04c428bdde6b4c3b96138f2d4fcbbb62.mp4",
  "video_only_url": "https://media.rumbletv.com/final_movie_video_only_04c428bdde6b4c3b96138f2d4fcbbb62.mp4",
  "audio_only_url": "https://media.rumbletv.com/final_movie_audio_only_04c428bdde6b4c3b96138f2d4fcbbb62.mp3",
  "created_at": "2025-08-12T20:11:06.348000",
  "updated_at": "2025-08-12T20:11:35.708000",
  "started_at": "2025-08-12T20:11:06.349000",
  "completed_at": "2025-08-12T20:11:35.708000",
  "error_message": null,
  "metadata": {
    "processing_time": 29.36,
    "total_scenes": 3,
    "total_video_duration": 21.0,
    "audio_duration": 23.0,
    "output_resolution": "1920x1080",
    "file_sizes": {
      "full_video": 6802679,
      "video_only": 6420555,
      "audio_only": 559155
    }
  }
}
```

**Response for Last Frame (Completed):**
```json
{
  "task_id": "68932ab1f918707cd6188d5f",
  "status": "completed",
  "video_url": "https://example.com/video.mp4",
  "image_url": "https://media.rumbletv.com/68932ab1f918707cd6188d5f.jpg",
  "created_at": "2025-08-06T10:13:05.833000",
  "completed_at": "2025-08-06T10:13:06.594000",
  "metadata": {
    "video_duration": 5.2,
    "video_resolution": "1920x1080",
    "processing_time": 0.5,
    "file_size": 1024000
  }
}
```

### Task Status Values

- `pending` - Task is queued and waiting to be processed
- `processing` - Task is currently being processed
- `completed` - Task completed successfully
- `failed` - Task failed with an error

---

## 🔔 Webhook Notifications

If you provide a `webhook_url`, the service will send a POST request to your endpoint when the task completes:

**Webhook Payload (Video Stitch):**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "status": "completed",
  "video_result_url": "https://media.rumbletv.com/result.mp4",
  "metadata": {
    "total_videos": 2,
    "processing_time": 4.03
  }
}
```

**Webhook Payload (Video+Audio Assembly):**
```json
{
  "task_id": "04c428bdde6b4c3b96138f2d4fcbbb62",
  "status": "completed",
  "full_video_url": "https://media.rumbletv.com/final_movie_04c428bdde6b4c3b96138f2d4fcbbb62.mp4",
  "video_only_url": "https://media.rumbletv.com/final_movie_video_only_04c428bdde6b4c3b96138f2d4fcbbb62.mp4",
  "audio_only_url": "https://media.rumbletv.com/final_movie_audio_only_04c428bdde6b4c3b96138f2d4fcbbb62.mp3",
  "metadata": {
    "processing_time": 29.36,
    "total_scenes": 3,
    "total_video_duration": 21.0,
    "audio_duration": 23.0
  }
}
```

**Webhook Payload (Last Frame):**
```json
{
  "task_id": "68932ab1f918707cd6188d5f",
  "status": "completed",
  "image_url": "https://media.rumbletv.com/frame.jpg",
  "metadata": {
    "processing_time": 0.5,
    "video_duration": 5.2
  }
}
```

---

## ⚡ Performance & Limits

### Processing Times
- **Last Frame Extraction**: ~0.5-2 seconds per video
- **Video Stitching**: ~2-5 seconds depending on video count and size
- **Video+Audio Assembly**: ~5-30 seconds depending on video count, duration, and complexity

### Supported Formats
- **Input**: MP4, AVI, MOV, MKV, WebM (video), MP3, WAV, AAC (audio)
- **Output**:
  - Last Frame: JPEG images
  - Video Stitch: MP4 videos
  - Video+Audio Assembly: MP4 videos (full, video-only), MP3 audio (audio-only)

### Limits
- **Video Stitch**: Minimum 2 videos, maximum 10 videos per request
- **Video+Audio Assembly**: Minimum 1 scene video, maximum 20 scene videos per request
- **File Size**: Maximum 500MB per video/audio file
- **Duration**: Maximum 10 minutes per video
- **Concurrent Tasks**: Up to 10 simultaneous processing tasks

---

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `404` - Task not found
- `500` - Internal server error

### Error Response Format
```json
{
  "detail": "Error description",
  "error": "error_type"
}
```

### Common Errors
- **Invalid video URL**: Video URL is not accessible
- **Invalid audio URL**: Audio URL is not accessible (assembly tasks)
- **Unsupported format**: Video/audio format not supported
- **File too large**: Video/audio exceeds size limits
- **Processing timeout**: Video processing took too long
- **Audio sync failed**: Audio duration doesn't match video duration (assembly tasks)
- **Scene video missing**: One or more scene videos failed to download (assembly tasks)

---

## 🔗 Webhook Management

### Register Webhook
Register or update a webhook URL for an existing task:

```http
POST /api/v1/webhook
Content-Type: application/json
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67

{
  "task_id": "68933d660fbe479408b185f1",
  "webhook_url": "https://your-webhook.com/notify"
}
```

**Response:**
```json
{
  "task_id": "68933d660fbe479408b185f1",
  "webhook_url": "https://your-webhook.com/notify",
  "message": "Webhook registered successfully"
}
```

---

## � Server Management Endpoints

### Get Recent Tasks
Retrieve a list of recent tasks:

```http
GET /api/v1/tasks/recent?limit=50
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**Response:**
```json
{
  "tasks": [
    {
      "task_id": "68933d660fbe479408b185f1",
      "status": "completed",
      "video_url": "https://example.com/video.mp4",
      "image_url": "https://media.rumbletv.com/image.jpg",
      "created_at": "2025-08-06T11:32:54.156000",
      "completed_at": "2025-08-06T11:32:58.181000"
    }
  ],
  "count": 1
}
```

### Server Status
Get detailed server status and statistics:

```http
GET /api/v1/server/status
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**Response:**
```json
{
  "server_status": "running",
  "active_tasks": 2,
  "queue_size": 5,
  "max_concurrent_tasks": 10,
  "gpu_utilization": 45.2,
  "memory_usage": 68.5,
  "uptime": 3600,
  "processed_videos_today": 150,
  "last_activity": "2025-08-06T11:32:58.181000"
}
```

### Server Statistics
Get comprehensive server statistics:

```http
GET /api/v1/server/stats
Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67
```

**Response:**
```json
{
  "server": {
    "status": "running",
    "uptime": 3600,
    "start_time": "2025-08-06T10:00:00.000000"
  },
  "tasks": {
    "pending": 5,
    "processing": 2,
    "completed": 143,
    "failed": 0,
    "total": 150
  },
  "queue": {
    "active_tasks": 2,
    "queue_size": 5,
    "max_concurrent": 10
  },
  "system": {
    "memory_usage": 68.5,
    "gpu_utilization": 45.2
  }
}
```

---

## �🛠️ Integration Examples

### cURL Examples

**Video Stitch:**
```bash
# Submit job
curl -X POST "https://last-frame.ft.tc/api/v1/stitch" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "video_urls": [
      "https://example.com/video1.mp4",
      "https://example.com/video2.mp4"
    ]
  }'

# Check status
curl "https://last-frame.ft.tc/api/v1/status/TASK_ID" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67"
```

**Audio Stitch:**
```bash
# Submit job
curl -X POST "https://last-frame.ft.tc/api/v1/audio-stitch" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_urls": [
      "https://example.com/intro.mp3",
      "empty:2.0",
      "https://example.com/main.wav",
      "empty:1.5",
      "https://example.com/outro.mp3"
    ]
  }'

# Check status
curl "https://last-frame.ft.tc/api/v1/status/TASK_ID" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67"
```

**Music Track Mixing:**
```bash
# Submit job
curl -X POST "https://last-frame.ft.tc/api/v1/music-track" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/presentation.mp4",
    "music_url": "https://example.com/background_music.mp3"
  }'

# Check status
curl "https://last-frame.ft.tc/api/v1/status/TASK_ID" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67"
```

**Video+Audio Assembly:**
```bash
# Submit job
curl -X POST "https://last-frame.ft.tc/api/v1/video/assemble-movie" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test_project_123",
    "scene_videos": [
      {
        "scene_id": "scene_001",
        "video_url": "https://example.com/scene1.mp4",
        "sequence_number": 1,
        "expected_duration": 30.0
      }
    ],
    "master_audio": {
      "audio_url": "https://example.com/audio.mp3",
      "expected_duration": 30.0
    }
  }'
```

**Last Frame:**
```bash
# Submit job
curl -X POST "https://last-frame.ft.tc/api/v1/process" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/video.mp4"
  }'
```

---

## 🔧 Technical Architecture

### Video+Audio Assembly Pipeline

The video assembly service uses an optimized pipeline for maximum quality and performance:

1. **Download Phase**: Parallel download of scene videos and master audio
2. **Validation Phase**: Verify file integrity and format compatibility
3. **Concatenation Phase**: Single FFmpeg concat operation with stream copy (`-c copy`)
4. **Audio Combination Phase**: Combine concatenated video with master audio using stream copy for video (`-c:v copy`) and AAC encoding for audio (`-c:a aac`)
5. **Extraction Phase**:
   - Video-only: Extract from concatenated video (pure source) using stream copy
   - Audio-only: Extract from final video using MP3 encoding
6. **Upload Phase**: Parallel upload to Cloudflare R2 with proper content types
7. **Cleanup Phase**: Remove temporary files

### Key Technical Improvements (v3.2)

- **Redis Synchronization Fix**: Resolved critical task status synchronization issues between MongoDB and Redis
- **Modular Task Architecture**: Refactored task processing into dedicated modules:
  - `app/tasks/video_processor.py` - Last frame extraction
  - `app/tasks/video_stitch_processor.py` - Video stitching
  - `app/tasks/audio_stitch_processor.py` - Audio stitching
  - `app/tasks/music_processor.py` - Music track processing
  - `app/tasks/video_assembly_processor.py` - Video+audio assembly
  - `app/tasks/media_length_processor.py` - Media duration detection
- **Event Loop Stability**: Fixed "Event loop is closed" errors by switching to synchronous Redis clients in Celery workers
- **Task Queue Management**: Enhanced active task tracking and cleanup in Redis
- **Comprehensive Logging**: Added detailed debug logging for task status updates and Redis operations
- **Reliability**: 100% consistent task status updates across all processors

### Key Technical Improvements (v3.1)

- **Stream Copy Approach**: No video re-encoding throughout pipeline maintains perfect quality
- **Single Concat Operation**: Eliminates timing discrepancies and gaps between scenes
- **Optimized Source Selection**: Video-only extracted from concatenated source, not processed final video
- **Proper Content Types**: Dedicated audio upload method with correct MIME types
- **Performance**: 5x faster processing (6s vs 26s+) with better quality

---

## 🔍 Troubleshooting

### Task Status Monitoring

The service now provides reliable task status tracking through both MongoDB and Redis:

- **MongoDB**: Persistent task storage with detailed metadata
- **Redis**: Real-time task queue management and status caching
- **Synchronization**: Both systems are kept in sync for all task state changes

### Common Issues Resolved (v3.2)

**Issue**: Tasks appear stuck in "pending" status
- **Cause**: Redis synchronization issues in previous versions
- **Resolution**: Fixed in v3.2 with proper Redis client handling
- **Verification**: Check both `/api/v1/status/{task_id}` and Redis directly

**Issue**: "Event loop is closed" errors in worker logs
- **Cause**: Async Redis clients incompatible with Celery worker context
- **Resolution**: Switched to synchronous Redis clients in all task processors
- **Impact**: 100% reliable task status updates

**Issue**: Tasks not removed from active queue after completion
- **Cause**: Failed Redis updates due to event loop issues
- **Resolution**: Enhanced task cleanup with verification steps
- **Monitoring**: Active task count available via Redis `SCARD active_tasks`

### Monitoring Commands

For system administrators, you can monitor the task queue directly:

```bash
# Check active task count
redis-cli SCARD active_tasks

# View specific task status
redis-cli HGETALL task:{task_id}

# List all active tasks
redis-cli SMEMBERS active_tasks
```

---

## 🔍 Monitoring & Troubleshooting

### Service Health Monitoring

Check if the service is healthy:

```bash
curl https://last-frame.ft.tc/health
```

### Common Issues

#### 1. Service Not Responding

**Symptoms:** API requests timeout or return 502/503 errors

**Check:**
```bash
# Check if PM2 processes are running
pm2 status

# View recent logs
pm2 logs last-frame-api --lines 50
```

**Solution:** Contact system administrator to restart services

#### 2. Task Stuck in "pending" Status

**Symptoms:** Task remains in pending status for extended period

**Check:**
```bash
# Check worker logs
pm2 logs last-frame-worker --lines 50

# Check Redis connection
redis-cli ping
```

**Solution:** The worker may be processing other tasks. Wait or contact administrator.

#### 3. Authentication Errors (401)

**Symptoms:** "Unauthorized" or "Invalid API key" errors

**Check:**
- Verify you're using the correct API key
- Ensure the Authorization header is properly formatted
- Check for extra spaces or newlines in the API key

**Solution:** Request a new API key from your administrator

#### 4. File Download Errors

**Symptoms:** Tasks fail with "Failed to download" errors

**Check:**
- Verify the video/audio URL is publicly accessible
- Test the URL in a browser
- Check file size (must be under 500MB)

**Solution:** Ensure URLs are publicly accessible and files meet size requirements

### Performance Tips

1. **Use Webhooks:** Instead of polling, provide a `webhook_url` to receive notifications
2. **Batch Processing:** Submit multiple tasks concurrently for better throughput
3. **Optimize Media:** Use compressed videos/audio when possible to reduce processing time
4. **Monitor Status:** Check `/api/v1/server/status` for queue size before submitting large batches

### Rate Limits

- **Concurrent Tasks:** Maximum 10 simultaneous processing tasks
- **File Size:** Maximum 500MB per file
- **Video Duration:** Maximum 10 minutes per video
- **Video Stitch:** Maximum 10 videos per request
- **Assembly:** Maximum 20 scene videos per request

### Getting Help

For technical support:

1. **Check Service Status:**
   ```bash
   curl https://last-frame.ft.tc/health
   ```

2. **Review API Documentation:**
   Visit: https://last-frame.ft.tc/docs

3. **Check Recent Tasks:**
   ```bash
   curl "https://last-frame.ft.tc/api/v1/tasks/recent?limit=10" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

4. **Contact Administrator:**
   - Provide task_id for failed tasks
   - Include error messages from API responses
   - Specify the endpoint and parameters used

## 📞 Support

For technical support or questions:
- **Service Status**: Check `/health` endpoint at https://last-frame.ft.tc/health
- **API Documentation**: Interactive docs at https://last-frame.ft.tc/docs
- **This Guide**: Complete usage documentation
- **System Administrator**: Contact for API keys, service issues, or infrastructure questions

### Administrator Resources

If you're managing the service:

```bash
# Check deployment status
bash /var/www/last-frame/check-deployment.sh

# View PM2 processes
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor resources
pm2 monit
```

For deployment and infrastructure documentation, see:
- `/var/www/last-frame/DEPLOYMENT-COMPLETE.md`
- `/var/www/last-frame/PRODUCTION-DEPLOYMENT.md`
- `/var/www/last-frame/DEPLOY-README.md`

---

## 📝 Changelog

### Version 3.3 (2025-10-04)
- ✅ **PRODUCTION DEPLOYMENT**: Service now deployed with PM2 and Nginx
- ✅ **HIGH AVAILABILITY**: Auto-restart on failure, auto-start on boot
- ✅ **HTTPS SUPPORT**: SSL/TLS ready (configure with Let's Encrypt)
- ✅ **MONITORING**: PM2 process monitoring and health checks
- ✅ **INFRASTRUCTURE**: Nginx reverse proxy with optimized settings
- ✅ **DOCUMENTATION**: Updated with production URLs and deployment info
- ✅ **SECURITY**: API key authentication with secure storage
- ✅ **PERFORMANCE**: Optimized Nginx configuration for large file uploads

### Version 3.2 (2025-01-18)
- ✅ **CRITICAL FIX**: Resolved Redis task status synchronization issues
- ✅ **ARCHITECTURE**: Refactored task processing into modular components in `app/tasks/`
- ✅ **RELIABILITY**: Fixed "Event loop is closed" errors in Celery workers
- ✅ **MONITORING**: Enhanced task queue management with proper Redis updates
- ✅ **CONSISTENCY**: All task processors now properly update both MongoDB and Redis
- ✅ **DEBUGGING**: Added comprehensive logging for task status tracking
- ✅ **PERFORMANCE**: Improved task completion detection and queue cleanup
- ✅ **DOCUMENTATION**: Added comprehensive Music Track Mixing endpoint documentation

### Version 3.1 (2025-08-12)
- ✅ **MAJOR PERFORMANCE IMPROVEMENTS**: Video assembly processing time reduced from 26s+ to ~6s
- ✅ **FIXED**: Video concatenation gaps eliminated with single FFmpeg concat operation
- ✅ **FIXED**: Video playback compatibility issues resolved with stream copy approach
- ✅ **FIXED**: Audio filename corruption (no more .mp3.mp4 extensions)
- ✅ **FIXED**: Video-only extraction compatibility improved
- ✅ **ENHANCED**: All three output files (full, video-only, audio-only) now play perfectly
- ✅ **OPTIMIZED**: Stream copy throughout pipeline for maximum quality and speed

### Version 3.0 (2025-08-12)
- ✅ Added Video+Audio Assembly feature
- ✅ Triple output generation (full video, video-only, audio-only)
- ✅ Advanced audio sync modes (stretch, trim, pad)
- ✅ Project-based assembly workflow
- ✅ Enhanced task status monitoring for assembly tasks

### Version 2.0 (2025-08-06)
- ✅ Added Video Stitching feature
- ✅ Enhanced task status monitoring
- ✅ Improved error handling
- ✅ Added webhook notifications
- ✅ Fixed async event loop stability issues
- ✅ Production-ready with 100% reliability
- ✅ Automated health monitoring system
- ✅ GitHub-based deployment workflow

### Version 1.0
- ✅ Last Frame Extraction service
- ✅ Basic API endpoints
- ✅ Task queue processing

## Test URLs

### Videos (for testing assembly service)
- Scene 1: https://media.ft.tc/microscenes/688f57e9d1c33e060586a7e8/ms_5bfee540_001_1754425085200/videos/1754425566822_microscene_ms_5bfee540_001_1754425085200_video.mp4 8s
- Scene 2: https://media.ft.tc/microscenes/688f57e9d1c33e060586a7e8/ms_5bfee540_002_1754425085217/videos/1754425760102_microscene_ms_5bfee540_002_1754425085217_video.mp4 8s 
- Scene 3: https://v3.fal.media/files/tiger/v-mrd2zt5dWXFKP9_Yl4q_output.mp4 7s
### Audio (for testing assembly service)
Custom voiceId ttv-voice-2025081113554425-GZsrWpm5
Model: minimax
master audio: https://v3.fal.media/files/kangaroo/rojNblPnFg5-N-l6I4tB2_speech.mp3 23s

### Example Assembly Test Request
```bash
curl -X POST "https://last-frame.ft.tc/api/v1/video/assemble-movie" \
  -H "Authorization: Bearer 121972d9789bbedfa0751974b62571b24329330bceee1c792e93b00ce7cd6a67" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test_project_123",
    "scene_videos": [
      {
        "scene_id": "scene_001",
        "video_url": "https://media.ft.tc/microscenes/688f57e9d1c33e060586a7e8/ms_5bfee540_001_1754425085200/videos/1754425566822_microscene_ms_5bfee540_001_1754425085200_video.mp4",
        "sequence_number": 1,
        "expected_duration": 8.0
      },
      {
        "scene_id": "scene_002",
        "video_url": "https://media.ft.tc/microscenes/688f57e9d1c33e060586a7e8/ms_5bfee540_002_1754425085217/videos/1754425760102_microscene_ms_5bfee540_002_1754425085217_video.mp4",
        "sequence_number": 2,
        "expected_duration": 8.0
      },
      {
        "scene_id": "scene_003",
        "video_url": "https://v3.fal.media/files/tiger/v-mrd2zt5dWXFKP9_Yl4q_output.mp4",
        "sequence_number": 3,
        "expected_duration": 7.0
      }
    ],
    "master_audio": {
      "audio_url": "https://v3.fal.media/files/kangaroo/rojNblPnFg5-N-l6I4tB2_speech.mp3",
      "expected_duration": 23.0
    },
    "output_settings": {
      "quality": "high",
      "audio_sync_mode": "stretch_to_fit"
    }
  }'
```

### Final Video Stitch assembly test urls
video_urls: [
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_1/videos/1755986125666_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_2/videos/1755986321604_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_3/videos/1755986501327_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_4/videos/1755986703954_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_5/videos/1755986911639_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_6/videos/1755987145945_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_7/videos/1755987367459_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_8/videos/1755987509491_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_9/videos/1755987575700_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_10/videos/1755987806838_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_11/videos/1755988020504_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_12/videos/1755988205409_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_13/videos/1755988423557_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_14/videos/1755988771948_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_15/videos/1755988989876_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_16/videos/1755989212058_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_17/videos/1756006303374_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_18/videos/1755989399505_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_19/videos/1755989548483_lipsync_video.mp4',
'https://media.rumbletv.com/scenes/68a7bea314973bd581cb715b/scene_20/videos/1756006797544_lipsync_video.mp4'
],

