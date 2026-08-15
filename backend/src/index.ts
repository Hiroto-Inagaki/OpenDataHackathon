import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// フロントエンド(Expo Web/別オリジン)からのAPI呼び出しを許可する。
app.use('/api/*', cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  name?: string
}

app.get('/api/geocode', async (c) => {
  const query = c.req.query('q')?.trim()

  if (!query) {
    return c.json({ error: 'q is required' }, 400)
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '10')
  url.searchParams.set('accept-language', 'ja')

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        // Nominatim usage policy requires a descriptive User-Agent.
        'User-Agent': 'yorimichi-sanpo-mvp/1.0 (hackathon prototype)',
      },
    })
  } catch {
    return c.json({ error: 'upstream request failed' }, 502)
  }

  if (!response.ok) {
    return c.json({ error: 'upstream request failed' }, 502)
  }

  const results = (await response.json()) as NominatimResult[]

  return c.json({
    results: results.map((result) => ({
      id: String(result.place_id),
      name: result.name || result.display_name.split(',')[0],
      address: result.display_name,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    })),
  })
})

export default app
