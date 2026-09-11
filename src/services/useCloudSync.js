import { useEffect, useRef, useState } from 'react'

const EMPTY_DATA = {
  expenses: [],
  income: [],
  categories: [],
  categoryEntries: {},
  netWorth: {},
  transfers: [],
  budgets: [],
}

const POLL_INTERVAL_MS = 3000

const restoreDates = (value, key = '') => {
  if (Array.isArray(value)) return value.map((item) => restoreDates(item, key))
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && /date$/i.test(key)) {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? value : date
    }
    return value
  }
  return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, restoreDates(entryValue, entryKey)]))
}

const applyData = (data, setters) => {
  const restored = restoreDates(data ?? EMPTY_DATA)
  setters.setExpenseEntries(Array.isArray(restored?.expenses) ? restored.expenses : [])
  setters.setIncomeEntries(Array.isArray(restored?.income) ? restored.income : [])
  setters.setCategoryDefinitions(Array.isArray(restored?.categories) ? restored.categories : [])
  setters.setCategoryEntriesByMonth(restored?.categoryEntries && typeof restored.categoryEntries === 'object' ? restored.categoryEntries : {})
  setters.setNetWorthEntriesByMonth(restored?.netWorth && typeof restored.netWorth === 'object' ? restored.netWorth : {})
  setters.setTransfers(Array.isArray(restored?.transfers) ? restored.transfers : [])
  setters.setBudgets(Array.isArray(restored?.budgets) ? restored.budgets : [])
}

const readCloudData = async () => {
  const response = await fetch('/api/data', { method: 'GET', cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
  if (!response.ok) throw new Error(`Unable to load Redis data (${response.status}).`)
  return response.json()
}

const saveCloudData = async (data) => {
  const response = await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) })
  if (!response.ok) throw new Error(`Unable to save Redis data (${response.status}).`)
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
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!cloudReady) return undefined
    if (skipNextSave.current) { skipNextSave.current = false; return undefined }
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
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [cloudReady, data.expenses, data.income, data.categories, data.categoryEntries, data.netWorth, data.transfers, data.budgets])

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
