
const $input = {
  as_today: true,
  integer_hour: 12,
  date: '2025-09-13',
}

const LOCALE = 'pt-BR'

function getPeriodLabel (responseLength: number, weekDay: number, currentDeliveryHour: number): string {
  const spread = periods_count === (responseLength + 1) && ![0, 6].includes(weekDay)
    ? 3
    : 2

  const current_hour = new Date(`${$input.date}T${currentDeliveryHour}:00:00`)
  const end_hour     = new Date(`${$input.date}T${currentDeliveryHour + spread}:00:00`)

  return [current_hour, end_hour]
    .map(time => time.toLocaleTimeString(LOCALE, localeTimeStringOptions))
    .join(' - ')
}

const localeTimeStringOptions: Intl.DateTimeFormatOptions = {
  hour12: true,
  hour: '2-digit',
  minute: '2-digit',
}

const now = new Date()

const timeZone = 'America/Sao_Paulo'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone,
  day: '2-digit',
  year: 'numeric',
  month: '2-digit',
})

const hourFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone,
  hour: '2-digit',
  second: '2-digit',
  minute: '2-digit',
})

const deliveryDate = new Date(`${$input.date}T00:00:00-03:00`)

const dateIsToday = dateFormatter.format(now) === dateFormatter.format(deliveryDate)

// Default time to starting delivery
const DELIVERY_STARTING_HOURS = 10

let periods_count: null | number = null
let current_delivery_hour = DELIVERY_STARTING_HOURS

const response = []

/**
 * 0 for Sunday and 6 for Saturday
 */
const week_day = new Date(`${$input.date}T00:00:00-03:00`).getDay()

switch (week_day) {
  case 0: // Sunday
    periods_count = 2

    if (dateIsToday && $input.integer_hour > 13) {
      periods_count         -= 2
      current_delivery_hour += 4
    }

    break
  case 6: // Saturday
    periods_count = 3

    if (dateIsToday) {
      current_delivery_hour += 4
      periods_count         -= 2
    }

    break
  case 5: // Friday
    periods_count = 4

    if (dateIsToday) {
      current_delivery_hour += 4
      periods_count         -= 2
    }

    break
  default:
    periods_count = 4

    if (dateIsToday) {
      current_delivery_hour += 4
      periods_count         -= 2
    }
}

while (response.length < periods_count) {
  const label = getPeriodLabel(response.length, week_day, current_delivery_hour)

  response.push({
    label,
    hour: current_delivery_hour,
    period: response.length < 2 ? 'P1' : 'P2'
  })

  current_delivery_hour += 2
}

console.log(response)
