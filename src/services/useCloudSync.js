import { useEffect, useRef, useState } from 'react'

const EMPTY_DATA = {
  expenses: [],
  income: [],
  categories: [],
  categoryEntries: {},
  netWorth: {},
  budgets: [],
}

const POLL_INTERVAL_MS = 3000

const applyData = (data, setters) => {
  setters.setExpenseEntries(Array.isArray(data?.expenses) ? data.expenses : [])
  setters.setIncomeEntries(Array.isArray(data?.income) ? data.income : [])
  setters.setCategoryDefinitions(Array.isArray(data?.categories) ? data.categories : [])
  setters.setCategoryEntriesByMonth(
    data?.categoryEntries && typeof data.categoryEntries === 'object' ? data.categoryEntries : {},
  )
  setters.setNetWorthEntriesByMonth(
    data?.netWorth && typeof data.netWorth === 'object' ? data.netWorth : {},
  )
  setters.setBudgets(Array.isArray(data?.budgets) ? data.budgets : [])
}

const readCloudData = async () => {
  const response = await fetch('/api/data', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })

  if (!response.ok) {
    throw new Error(`Unable to load Redis data (${response.status}).`)
  }

  return response.json()
}

const saveCloudData = async (data) => {
  const response = await fetch('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    throw new Error(`Unable to save Redis data (${response.status}).`)
  }

  return response.json()
}

export default function useCloudSync(data, setters) {
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('loading')
  const [cloudError, setCloudError] = useState('')
  const latestUpdatedAt = useRef(0)
  const skipNextSave = useRef(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    let cancelled = false

    const loadFromRedis = async () => {
      try {
        const result = await readCloudData()
        const stored = result?.data

        if (cancelled) return

        latestUpdatedAt.current = Number(stored?.updatedAt ?? 0)
        skipNextSave.current = true
        applyData(stored?.data ?? EMPTY_DATA, setters)
        setCloudError('')
        setCloudReady(true)
        setSyncStatus('connected')
      } catch (error) {
        console.error('Redis load failed:', error)
        if (!cancelled) {
          setCloudError(error.message || 'Unable to connect to Redis.')
          setCloudReady(false)
          setSyncStatus('offline')
        }
      }
    }

    loadFromRedis()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cloudReady) return undefined

    if (skipNextSave.current) {
      skipNextSave.current = false
      return undefined
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(async () => {
      try {
        setSyncStatus('saving')
        const result = await saveCloudData(data)
        latestUpdatedAt.current = Number(result?.updatedAt ?? Date.now())
        setCloudError('')
        setSyncStatus('connected')
      } catch (error) {
        console.error('Redis save failed:', error)
        setCloudError(error.message || 'Unable to save to Redis.')
        setSyncStatus('offline')
      }
    }, 150)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [cloudReady, data.expenses, data.income, data.categories, data.categoryEntries, data.netWorth, data.budgets])

  useEffect(() => {
    if (!cloudReady) return undefined

    const checkRedis = async () => {
      try {
        const result = await readCloudData()
        const stored = result?.data
        const updatedAt = Number(stored?.updatedAt ?? 0)

        if (!stored?.data || updatedAt <= latestUpdatedAt.current) return

        latestUpdatedAt.current = updatedAt
        skipNextSave.current = true
        applyData(stored.data, setters)
        setCloudError('')
        setSyncStatus('connected')
      } catch (error) {
        console.error('Redis refresh failed:', error)
        setSyncStatus('offline')
      }
    }

    const intervalId = setInterval(checkRedis, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [cloudReady])

  return { cloudReady, syncStatus, cloudError }
}
