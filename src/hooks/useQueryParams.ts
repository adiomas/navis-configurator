import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useQueryParam(key: string, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback((newValue: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newValue) next.set(key, newValue)
      else next.delete(key)
      return next
    }, { replace: true })
  }, [key, setSearchParams])

  return [value, setValue] as const
}
