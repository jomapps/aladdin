/**
 * Streaming Utilities
 * Server-Sent Events (SSE) implementation for real-time updates
 */

export interface StreamMessage {
  type: 'token' | 'complete' | 'error' | 'progress'
  data: any
  timestamp: number
}

/**
 * Create SSE response stream
 */
export function createSSEStream(): {
  stream: ReadableStream
  send: (message: StreamMessage) => void
  close: () => void
} {
  let controller: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      controller = null
    },
  })

  const send = (message: StreamMessage) => {
    if (!controller) return

    const data = JSON.stringify(message)
    const chunk = `data: ${data}\n\n`

    controller.enqueue(new TextEncoder().encode(chunk))
  }

  const close = () => {
    if (controller) {
      controller.close()
      controller = null
    }
  }

  return { stream, send, close }
}

/**
 * Stream LLM tokens in real-time
 */
export async function streamLLMTokens(
  messages: any[],
  options: {
    onToken: (token: string) => void
    onComplete: (fullText: string) => void
    onError: (error: Error) => void
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<void> {
  const {
    onToken,
    onComplete,
    onError,
    model = process.env.OPENROUTER_DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2000,
  } = options

  try {
    const response = await fetch(
      `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true, // Enable streaming
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete(fullText)
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            onComplete(fullText)
            return
          }

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content

            if (token) {
              fullText += token
              onToken(token)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error)
  }
}
