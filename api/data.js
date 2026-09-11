const DATA_KEY = 'finance-tracker:data'

const getConfig = () => ({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function redisRequest(path, options = {}) {
  const { url, token } = getConfig()
  if (!url || !token) throw new Error('Upstash Redis environment variables are not configured.')

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.error) {
    throw new Error(body.error || `Redis request failed with status ${response.status}.`)
  }
  return body.result
}

const sendJson = (res, status, body) => {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    .send(JSON.stringify(body))
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const raw = await redisRequest(`/get/${encodeURIComponent(DATA_KEY)}`)
      const stored = raw ? JSON.parse(raw) : null
      return sendJson(res, 200, { data: stored })
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      if (!body?.data || typeof body.data !== 'object') {
        return sendJson(res, 400, { error: 'A data object is required.' })
      }

      const payload = {
        version: 1,
        updatedAt: Date.now(),
        data: body.data,
      }

      await redisRequest(`/set/${encodeURIComponent(DATA_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      return sendJson(res, 200, payload)
    }

    res.setHeader('Allow', 'GET, PUT')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  } catch (error) {
    console.error('Finance data API error:', error)
    return sendJson(res, 500, { error: error.message || 'Unexpected server error.' })
  }
}
