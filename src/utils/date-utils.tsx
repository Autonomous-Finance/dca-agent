import { formatDistanceToNowStrict, format } from "date-fns"

export function formatRelative(date: Date) {
  if (!date) return

  const distance = formatDistanceToNowStrict(date, { addSuffix: true })
  return distance
}

export function parseUtcString(dateString: string): Date {
  const date = new Date(dateString)

  const utcTimezoneOffsetHours = -(date.getTimezoneOffset() / 60)
  date.setHours(date.getHours() + utcTimezoneOffsetHours)

  return date
}

export function formatFullDate(date: Date) {
  if (!date) return

  const formattedDate = format(date, "yyyy-MM-dd HH:mm:ss")
  return formattedDate
}

export function formatAbsString(dateString: string) {
  const date = new Date()

  // YYYY-MM-DD
  const parts = dateString.split("-")

  date.setFullYear(Number(parts[0]))
  date.setMonth(Number(parts[1]) - 1)
  date.setDate(Number(parts[2]))
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)

  return date.getTime()
}

export function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds.toFixed(0)} seconds`
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(0)} minutes`
  } else {
    return `${(seconds / 3600).toFixed(0)} hours`
  }
}
