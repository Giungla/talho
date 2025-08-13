
import type {
  PixOrderData,
  PixOrderDataPoll,
  TalhoPixProcessData,
  TalhoPixProcessWatch,
  TalhoPixProcessSetup,
  TalhoPixProcessContext,
  TalhoPixProcessMethods,
  TalhoPixOrderComputedDefinition,
} from '../types/pix-process'

import type {
  Nullable,
  ResponsePattern
} from '../global'

const {
  createApp,
} = window.Vue

import {
  NULL_VALUE,
  EMPTY_STRING,
  BRLFormatter,
  XANO_BASE_URL,
  isNull,
  buildURL,
  safeParseJson,
  addAttribute,
  getAttribute,
  isPageLoading,
  querySelector,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
} from '../utils'

const DEFAULT_TIME = '00:00:00'

const PROCESS_PAYMENT_URL = `${XANO_BASE_URL}/api:5lp3Lw8X`

const ORDER_CONFIRM_URL = '/pagamento/confirmacao-do-pedido'

const TalhoOrderPage = createApp({
  name: 'PIXProcessPage',

  setup () {
    const hasEventSource = Vue.shallowRef<Nullable<boolean>>(NULL_VALUE)

    return {
      hasEventSource
    }
  },

  data () {
    return {
      now: Date.now(),
      isLoading: true,
      hasCopied: false,
      order: NULL_VALUE,
      nowInterval: NULL_VALUE,
    }
  },

  async created (): Promise<void> {
    this.hasEventSource = 'EventSource' in window

    const searchParams = new URLSearchParams(location.search)

    const transactionId = searchParams.get('order')

    if (!transactionId) {
      location.href = buildURL('/')

      return
    }

    const response = await this.getOrder(transactionId)

    if (!response.succeeded || response.data.payment_method !== 'pix') {
      location.href = buildURL('/')

      return
    }

    this.isLoading = false

    this.order = response.data

    this.setQRImage()

    if (response.data.pago) {
      setTimeout(() => {
        location.href = buildURL(ORDER_CONFIRM_URL, {
          order: transactionId
        })
      }, 5000)

      return
    }

    if (response.data.expired) return

    this.nowInterval = setInterval(() => this.now = Date.now(), 1000)

    if (this.hasEventSource) {
      return this.pollOrder(transactionId)
    }
  },

  methods: {
    pollOrder (orderId: string): void {
      const source = new EventSource(`${PROCESS_PAYMENT_URL}/confirm-pix/${orderId}`)

      source.addEventListener('message', async (event: MessageEvent<string>) => {
        const orderData = safeParseJson<PixOrderDataPoll>(event.data)

        if (isNull(orderData)) return

        this.patchOrder({
          ...orderData,
          expired: DEFAULT_TIME === this.timmer || orderData.expired,
        })

        if (this.hasPaid || this.isExpired) {
          source.readyState !== source.CLOSED && source.close()

          this.clearInterval()
        }

        if (!this.hasPaid) return

        setTimeout(() => {
          location.href = buildURL(ORDER_CONFIRM_URL, {
            order: orderId
          })
        }, 5000)
      })

      document.addEventListener('beforeunload', () => {
        if (source.readyState === source.CLOSED) return

        source.close()

        this.clearInterval()
      })
    },

    patchOrder ({ pago, expired, total }: PixOrderDataPoll): void {
      if (!this.order) return

      this.order.pago = pago
      this.order.total = total
      this.order.expired = expired
    },

    async getOrder (orderId: string): Promise<ResponsePattern<PixOrderData>> {
      const defaultErrorMessage = 'Falha ao capturar o pedido'

      try {
        const response = await fetch(`${PROCESS_PAYMENT_URL}/confirm-pix/${orderId}/rest`, {
          ...buildRequestOptions(),
        })

        if (!response.ok) {
          const error = await response.json()

          return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
        }

        const data: PixOrderData = await response.json()

        return postSuccessResponse.call(response, data)
      } catch (e) {
        return postErrorResponse(defaultErrorMessage)
      }
    },

    async handleCopyQRCode (): Promise<void> {
      if (this.hasCopied) return

      this.hasCopied = true

      if (navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.order?.qrcode_text ?? '')
      } else {
        const input = document.createElement('input')

        document.body.appendChild(input)

        input.value = this.order?.qrcode_text ?? ''

        input.select()

        document.execCommand('copy')

        document.body.removeChild(input)
      }

      setTimeout(() => this.hasCopied = false, 3000)
    },

    setQRImage (): void {
      const QRImage = querySelector('[data-wtf-qr-code-image]')

      if (!QRImage) return

      QRImage.onload = () => isPageLoading(false)

      addAttribute(
        QRImage,
        'src',
        this.order?.qrcode ?? getAttribute(QRImage, 'src')
      )
    },

    clearInterval (): void {
      clearInterval(this.nowInterval as number)

      this.nowInterval = NULL_VALUE
    },
  },

  computed: {
    orderPrice (): string {
      const { order } = this

      return BRLFormatter.format(
        order
          ? (order.total / 100)
          : 0
      )
    },

    timmer (): string {
      if (!this.order || this.isExpired) return DEFAULT_TIME

      const secondsDiff = Math.floor(Math.max((this.order?.due_time ?? 0) - this.now, 0) / 1000)

      const hours = Math.floor(secondsDiff / 3600)
      const minutes = Math.floor((secondsDiff % 3600) / 60)
      const seconds = secondsDiff % 60

      return [hours, minutes, seconds]
        .map(time => time.toString().padStart(2, '0'))
        .join(':')
    },

    hasPaid (): boolean {
      return this.order?.pago ?? false
    },

    isExpired (): boolean {
      return this.order?.expired ?? false
    },

    getQRCode (): string {
      return this.order?.qrcode_text ?? EMPTY_STRING
    },
  },

  watch: {
    timmer (time: string): void {
      if (time !== DEFAULT_TIME) return

      this.patchOrder({
        expired: true,
        total: this.order?.total ?? 0,
        pago: this.order?.pago ?? false,
      })
    }
  },
} satisfies {
  name: string;
  setup: () => TalhoPixProcessSetup;
  created: () => Promise<void>;
  data: () => TalhoPixProcessData;
  methods: TalhoPixProcessMethods;
  computed: TalhoPixOrderComputedDefinition;
  watch: TalhoPixProcessWatch;
} & ThisType<TalhoPixProcessContext>)

TalhoOrderPage.mount(querySelector('#pixProcess'))
