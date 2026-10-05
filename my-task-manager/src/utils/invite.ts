export const inviteCode = (input: string) => input.match(/[0-9a-f]{64}/i)?.[0].toLowerCase() ?? null
