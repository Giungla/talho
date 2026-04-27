
import {
  pageViewTracking,
} from '../utils/tracking'

pageViewTracking().then(response => {
  if (!response.succeeded) return

  const {
    meta,
  } = response.data

  fbq?.('init' , meta.app_id, meta.customer_data ?? {})

  fbq?.('track', 'PageView', {}, {
    eventID: meta.event_id,
  })
})
