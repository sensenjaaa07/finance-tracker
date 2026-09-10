import { useEffect, useRef, useState } from 'react'

const EMPTY_DATA = {
  expenses: [],
  income: [],
  categories: [],
  categoryEntries: {},
  netWorth: {},
  budgets: [],
}

const hasLocalData = (data) => (
  data.expenses.length > 0 ||
  data.income.length > 0 ||
  data.categories.length > 0 ||
  Object.keys(data.categoryEntries).length > 0 ||
  Object.keys(data.netWorth).length > 0 ||
  data.budgets.length > 0
)

const applyData = (data, setters) => {
  setters.setExpenseEntries(Array.isArray(data.expenses) ? data.expenses : [])
  setters.setIncomeEntries(Array.isArray(data.income) ? data.income : [])
  setters.setCategoryDefinitions(Array.isArray(data.categories) ? data.categories : [])
  setters.setCategoryEntriesByMonth(data.categoryEntries && typeof data.categoryEntries === 'object' ? data.categoryEntries : {})
  setters.setNetWorthEntriesByMonth(data.netWorth && typeof data.netWorth === 'object' ? data.netWorth : {})
  setters.setBudgets(Array.isArray(data.budgets) ? data.budgets : [])
}

export default function useCloudSync(data, setters) {
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('connecting')
  const skipNextSync = useRef(false)
  const latestUpdatedAt = useRef(0)
  const pendingSyncTimer = useRef(null)

  const syncToCloud = async (payload) => {
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload }),
    })

    if (!response.ok) throw new Error('Cloud sync failed.')
    const result = await response.json()
    latestUpdatedAt.current = Number(result.updatedAt ?? Date.now())
  }

  useEffect(() => {
    let cancelled = false

    const loadCloudData = async () => {
      try {
        setSyncStatus('connecting')
        const response = await fetch('/api/data', { cache: 'no-store' })
        if (!response.ok) throw new Error('Unable to load cloud data.')

        const result = await response.json()
        const stored = result.data

        if (cancelled) return

        skipNextSync.current = true

        if (stored?.data) {
          latestUpdatedAt.current = Number(stored.updatedAt ?? 0)
          applyData(stored.data, setters)
        } else if (hasLocalData(data)) {
          await syncToCloud(data)
        } else {
          applyData(EMPTY_DATA, setters)
        }

        if (!cancelled) {
          setCloudReady(true)
          setSyncStatus('connected')
        }
      } catch (error) {
        console.error('Cloud sync initialization failed:', error)
        if (!cancelled) {
          setCloudReady(true)
          setSyncStatus('offline')
        }
      }
    }

    loadCloudData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!cloudReady) return

    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }

    if (pendingSyncTimer.current) clearTimeout(pendingSyncTimer.current)

    pendingSyncTimer.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing')
        await syncToCloud(data)
        setSyncStatus('connected')
      } catch (error) {
        console.error('Cloud sync failed:', error)
        setSyncStatus('offline')
      }
    }, 150)

    return () => {
      if (pendingSyncTimer.current) clearTimeout(pendingSyncTimer.current)
    }
  }, [cloudReady, data.expenses, data.income, data.categories, data.categoryEntries, data.netWorth, data.budgets])

  useEffect(() => {
    if (!cloudReady) return undefined

    const source = new EventSource('/api/realtime')

    source.onopen = () => setSyncStatus('connected')

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const updatedAt = Number(payload.updatedAt ?? 0)

        if (!payload.data || updatedAt <= latestUpdatedAt.current) return

        latestUpdatedAt.current = updatedAt
        skipNextSync.current = true
        applyData(payload.data, setters)
        setSyncStatus('connected')
      } catch (error) {
        console.error('Invalid realtime update:', error)
      }
    }

    source.onerror = () => setSyncStatus('reconnecting')

    return () => source.close()
  }, [cloudReady])

  return { cloudReady, syncStatus }
}
