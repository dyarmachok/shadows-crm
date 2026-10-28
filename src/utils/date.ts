export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const dateTimeFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })
const timeFormat = new Intl.DateTimeFormat('uk-UA', { timeStyle: 'short' })
const dayFormat = new Intl.DateTimeFormat('uk-UA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
// en-CA форматує дату як YYYY-MM-DD
const isoDateFormat = new Intl.DateTimeFormat('en-CA', { timeZone })

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))

export const formatTime = (iso: string) => timeFormat.format(new Date(iso))

/** YYYY-MM-DD → «субота, 1 листопада» */
export const formatDay = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`))

/** Локальна дата моменту часу у форматі YYYY-MM-DD */
export const toLocalDate = (iso: string | Date) => isoDateFormat.format(new Date(iso))

export const today = () => toLocalDate(new Date())

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
