import { useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export function useRealtime(topic: string | null, onChange: () => void) {
    const latest = useRef(onChange)

    useEffect(() => {
        latest.current = onChange
    })

    useEffect(() => {
        if (!topic) return
        let timer: ReturnType<typeof setTimeout> | undefined
        const channel = supabase
            .channel(topic, { config: { private: true } })
            .on('broadcast', { event: 'change' }, () => {
                clearTimeout(timer)
                timer = setTimeout(() => latest.current(), 200)
            })
            .subscribe()
        return () => {
            clearTimeout(timer)
            supabase.removeChannel(channel)
        }
    }, [topic])
}
