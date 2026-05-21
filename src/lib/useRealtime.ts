import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeSubscription(
  table: string,
  householdId: string | null,
  onEvent: () => void,
) {
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  useEffect(() => {
    if (!householdId) return

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `household_id=eq.${householdId}`,
        },
        () => callbackRef.current(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, householdId])
}
