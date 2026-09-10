const CHANNEL = 'finance-tracker:sync'

export const config = {
  maxDuration: 300,
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed.')
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    return res.status(500).send('Upstash Redis environment variables are not configured.')
  }

  const subscription = await fetch(`${redisUrl}/subscribe/${encodeURIComponent(CHANNEL)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      Accept: 'text/event-stream',
    },
  })

  if (!subscription.ok || !subscription.body) {
    const message = await subscription.text().catch(() => '')
    return res.status(502).send(message || 'Unable to subscribe to Redis realtime updates.')
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const reader = subscription.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const writeEvent = (message) => {
    if (!message) return
    res.write(`data: ${message}\n\n`)
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const event of events) {
        const dataLine = event.split('\n').find((line) => line.startsWith('data: '))
        if (!dataLine) continue

        const message = dataLine.slice(6)
        if (message.startsWith('message,')) {
          const payload = message.split(',').slice(2).join(',')
          writeEvent(payload)
        }
      }
    }
  } catch (error) {
    if (!res.writableEnded) {
      console.error('Realtime stream error:', error)
    }
  } finally {
    reader.cancel().catch(() => {})
    if (!res.writableEnded) res.end()
  }
}
