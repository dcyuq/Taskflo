export const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'A letter', test: (p: string) => /[a-z]/i.test(p) },
    { label: 'A number', test: (p: string) => /\d/.test(p) },
]
