export const PASSWORD_MAX = 128

export const passwordRules = [
    { label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
    { label: 'An uppercase letter', test: (p: string) => /\p{Lu}/u.test(p) },
    { label: 'A lowercase letter', test: (p: string) => /\p{Ll}/u.test(p) },
    { label: 'A number', test: (p: string) => /\d/.test(p) },
    { label: 'A symbol', test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p) },
]
