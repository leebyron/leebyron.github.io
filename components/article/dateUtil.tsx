export function isoDate(date: Date | string): string {
  return new Date(String(date)).toISOString()
}

export function shortDate(date: Date | string): string {
  try {
    return new Date(String(date)).toLocaleDateString(undefined, {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    if (error.name === 'RangeError') {
      return new Date(String(date)).toDateString()
    }
    throw error
  }
}

export function longDate(date: Date | string): string {
  try {
    return new Date(String(date)).toLocaleString(undefined, {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'long'
    })
  } catch (error) {
    if (error.name === 'RangeError') {
      return String(date)
    }
    throw error
  }
}
