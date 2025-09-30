# External Services Integration

**Version**: 1.0.0  
**Last Updated**: January 28, 2025

---

## 1. FAL.ai Integration

### Installation

```bash
pnpm add @fal-ai/serverless-client
```

### Environment Variables

```bash
# FAL.ai API Key
FAL_AI_API_KEY=your_fal_api_key

# Image Generation Models
FAL_AI_TEXT_TO_IMAGE=fal-ai/flux-pro/v1.1
FAL_AI_IMAGE_TO_IMAGE=fal-ai/flux-pro/v1.1-canny
FAL_AI_IMAGES_TO_IMAGE=fal-ai/pulid-flux

# Video Generation Models
FAL_AI_TEXT_TO_VIDEO=fal-ai/minimax-video
FAL_AI_IMAGE_TO_VIDEO=fal-ai/kling-video/v1/standard/image-to-video
FAL_AI_FIRST_LAST_TO_VIDEO=fal-ai/runway-gen3/turbo/image-to-video
FAL_AI_VIDEO_TO_VIDEO=fal-ai/luma-video-to-video
```

### Usage Pattern

```typescript
// src/lib/fal/client.ts
import * as fal from '@fal-ai/serverless-client'

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
})

export async function generateImage(prompt: string) {
  const result = await fal.subscribe(process.env.FAL_AI_TEXT_TO_IMAGE!, {
    input: {
      prompt,
      image_size: 'landscape_16_9',
    },
  })
  
  return result.data
}

export async function generateVideo({
  imageUrl,
  prompt,
}: {
  imageUrl: string
  prompt: string
}) {
  const result = await fal.subscribe(process.env.FAL_AI_IMAGE_TO_VIDEO!, {
    input: {
      image_url: imageUrl,
      prompt,
    },
  })
  
  return result.data
}
```

---

## 2. ElevenLabs Integration

### Installation

```bash
pnpm add elevenlabs
```

### Environment Variables

```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Usage Pattern

```typescript
// src/lib/elevenlabs/client.ts
import { ElevenLabsClient } from 'elevenlabs'

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
})

export async function createVoice({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const voice = await elevenlabs.voices.add({
    name,
    description,
  })
  
  return voice.voice_id
}

export async function generateSpeech({
  voiceId,
  text,
}: {
  voiceId: string
  text: string
}) {
  const audio = await elevenlabs.generate({
    voice: voiceId,
    text,
    model_id: 'eleven_monolingual_v1',
  })
  
  return audio
}
```

---

## 3. Codebuff SDK Integration

### Installation

```bash
pnpm add @codebuff/sdk zod
```

### Environment Variables

```bash
CODEBUFF_API_KEY=your_codebuff_api_key
```

### Usage Pattern

```typescript
// src/lib/codebuff/client.ts
import { CodebuffClient } from '@codebuff/sdk'

const codebuff = new CodebuffClient({
  apiKey: process.env.CODEBUFF_API_KEY!,
})

export async function runAgent({
  agentId,
  prompt,
}: {
  agentId: string
  prompt: string
}) {
  const result = await codebuff.run({
    agent: agentId,
    prompt,
  })
  
  return result
}
```

---

**Status**: External Services Patterns Documented ✓