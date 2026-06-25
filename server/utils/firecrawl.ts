// Just for now, but seriously, it would be really nice if the Node SDK was compatible with Bun and Cloudflare Workers.

type FirecrawlScrapeResponse = {
  success?: boolean
  data?: unknown
  error?: string
}

type FirecrawlScrapeOptions = Record<string, unknown> & {
  timeout?: number
}

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev'

async function readFirecrawlResponse(response: Response): Promise<FirecrawlScrapeResponse> {
  try {
    return await response.json() as FirecrawlScrapeResponse
  } catch {
    return {}
  }
}

export async function scrapeWithFirecrawl(
  apiKey: string,
  url: string,
  options: FirecrawlScrapeOptions,
): Promise<unknown> {
  const controller = new AbortController()
  const timeoutMs = typeof options.timeout === 'number' ? options.timeout + 5_000 : 65_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/v2/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.trim(), ...options }),
      signal: controller.signal,
    })

    const payload = await readFirecrawlResponse(response)
    if (!response.ok || !payload.success) {
      const message = payload.error || response.statusText || 'Firecrawl scrape failed'
      throw new Error(`Firecrawl scrape failed with status ${response.status}: ${message}`)
    }

    return payload.data || {}
  } finally {
    clearTimeout(timeout)
  }
}
