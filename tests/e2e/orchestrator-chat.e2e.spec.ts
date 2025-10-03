import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const PROJECT_ID = process.env.E2E_PROJECT_ID || '68df4dab400c86a6a8cf40c6'

// Minimal e2e that verifies orchestrator chat streams a reply on localhost
// Requirements:
// - Dev server running (or run with a config that starts it)
// - NODE_ENV=development (auth bypass) and OPENROUTER_API_KEY set

test.describe('RightOrchestrator Chat (localhost)', () => {
  test.setTimeout(120_000)

  test('sends a chat prompt and receives assistant reply', async ({ page }) => {
    const prompt = 'Write me a short story about Aladdin and the forty thieves.'

    // Navigate to Gather page (any project page works; using projectId param)
    await page.goto(`${BASE_URL}/dashboard/project/${PROJECT_ID}/gather`)

    // Open the AI Assistant panel (floating toggle button)
    await page.getByRole('button', { name: 'Open AI Assistant' }).click()

    // Ensure Chat mode selected
    await page.getByRole('button', { name: 'Chat' }).click()

    // Type prompt and send with Enter (MessageInput handles Enter to submit)
    const textarea = page.locator('textarea[placeholder="Ask me anything..."]')
    await textarea.click()
    await textarea.fill(prompt)

    const chatPostPromise = page.waitForResponse((res) => {
      return res.url().includes('/api/v1/orchestrator/chat') && res.request().method() === 'POST'
    })

    // Send by pressing Enter (without Shift)
    await textarea.press('Enter')

    // Verify the POST succeeded
    const chatResponse = await chatPostPromise
    expect(chatResponse.ok()).toBeTruthy()

    // Streaming indicator should appear
    await page.getByText('Thinking...').first().waitFor({ state: 'visible', timeout: 30_000 })

    // Wait until we see any assistant-rendered prose content that is not exactly the user prompt
    // This checks that streaming completed and a reply was rendered
    await page.waitForFunction(
      (userPrompt) => {
        const nodes = Array.from(document.querySelectorAll('.prose')) as HTMLElement[]
        // There will be a `.prose` for the user bubble; ensure we see another with different text
        return nodes.some((n) => {
          const txt = (n.innerText || '').trim()
          return txt.length > 0 && !txt.includes(userPrompt)
        })
      },
      prompt,
      { timeout: 90_000 }
    )

    // Basic smoke assertion that some text appeared (optional extra)
    const assistantTextSample = await page.locator('.prose').nth(0).innerText()
    expect(assistantTextSample?.length).toBeGreaterThan(0)
  })
})

