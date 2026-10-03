import { useRef, useState } from 'react'

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

const split = (raw: string) => raw.split(/[\s,;]+/).map(p => p.trim().toLowerCase()).filter(Boolean)

export function useEmailChips(exclude: string[], excludedNotice: string) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [draft, setDraft] = useState('')
    const [emails, setEmails] = useState<string[]>([])
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const skip = exclude.map(e => e.toLowerCase())

    function commit(raw: string) {
        const parts = split(raw)
        if (parts.length === 0) return true
        const invalid = parts.filter(p => !EMAIL_PATTERN.test(p))
        const valid = parts.filter(p => EMAIL_PATTERN.test(p) && !skip.includes(p))
        const excluded = parts.some(p => skip.includes(p))
        setEmails(list => [...new Set([...list, ...valid])])
        if (invalid.length > 0) {
            setDraft(invalid.join(', '))
            setError(invalid.length === 1
                ? `"${invalid[0]}" doesn't look like an email address.`
                : `${invalid.length} entries don't look like email addresses.`)
            return false
        }
        setDraft('')
        setError('')
        setNotice(excluded ? excludedNotice : '')
        return true
    }

    function collect() {
        if (draft.trim() && !commit(draft)) return null
        const pending = split(draft).filter(p => EMAIL_PATTERN.test(p) && !skip.includes(p))
        return [...new Set([...emails, ...pending])]
    }

    function remove(email: string) {
        setEmails(list => list.filter(x => x !== email))
        inputRef.current?.focus()
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            if (draft.trim()) {
                e.preventDefault()
                commit(draft)
            }
        } else if (e.key === 'Backspace' && draft === '' && emails.length > 0) {
            setEmails(list => list.slice(0, -1))
        }
    }

    function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData.getData('text')
        if (/[\s,;]/.test(text.trim())) {
            e.preventDefault()
            commit(`${draft} ${text}`)
        }
    }

    function reset() {
        setDraft('')
        setEmails([])
        setError('')
        setNotice('')
    }

    return { inputRef, draft, setDraft, emails, error, setError, notice, commit, collect, remove, onKeyDown, onPaste, reset }
}

export type EmailChips = ReturnType<typeof useEmailChips>
