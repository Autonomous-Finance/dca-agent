export const shortenId = (id: string): string => {
  if (!id || id.length <= 16) return id
  return id.slice(0, 8) + "..." + id.slice(-8)
}