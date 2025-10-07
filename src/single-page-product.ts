
import type {
  ComputedFinalPrices,
  CreateCartProduct,
  FunctionSucceededPattern,
  Nullable,
  Prices,
  ResponsePattern,
  SingleProductPageProduct,
  SingleProductPageState,
  SingleProductPageStateHandler,
  SingleProductPageStateKeys,
} from '../global'

import type {
  AddToCartParams,
  DeliveryQuotationBody,
  GetProductParams,
  GetProductResponse,
  LocationList,
  LocationResponse,
  QuotationPayload,
  QuotationPrice,
} from '../types/single-page-product'

import {
  NULL_VALUE,
  BRLFormatter,
  XANO_BASE_URL,
  GENERAL_HIDDEN_CLASS,
  STORAGE_KEY_NAME,
  attachEvent,
  clamp,
  stringify,
  postErrorResponse,
  postSuccessResponse,
  buildRequestOptions,
  addClass,
  querySelector,
  changeTextContent,
  toggleClass,
  removeClass,
  removeAttribute,
  objectSize,
  isNull,
} from '../utils'

const SELECTED_CLASS = 'selecionado'
const CART_SWITCH_CLASS = 'carrinhoflutuante--visible'

const CART_BASE_URL = `${XANO_BASE_URL}/api:79PnTkh_`

const CLICK_EVENT = 'click'

/** Quantidade mínima de produtos permitidos no carrinho */
const MIN_PRODUCT_QUANTITY = 1
/** Quantidade máxima de produtos permitados no carrinho */
const MAX_PRODUCT_QUANTITY = 10

const REQUEST_POST = 'POST'

const COUNTER_REPLACEMENT = '{count}'

const STOCK_MESSAGE = [
  `Temos apenas ${COUNTER_REPLACEMENT} unidade disponível.`,
  `Temos apenas ${COUNTER_REPLACEMENT} unidades disponíveis.`,
]

const _state: SingleProductPageState = {
  quantity: 1,
  stockCount: 0,
  product: NULL_VALUE,
  selectedVariation: NULL_VALUE,
}

const slug = location.pathname.split('/')

const state = new Proxy<SingleProductPageState>(_state, {
  get (
    target,
    key: keyof (SingleProductPageState & SingleProductPageStateHandler)
  ): any {
    switch (key) {
      case 'variationsCount':
        return objectSize(target.product?.variations ?? [])
      case 'hasPriceDifference':
        {
          const { price, full_price } = state.prices

          return price !== full_price
        }
      case 'prices':
        {
          const { product, selectedVariation } = target

          if (!product || !state.hasSelectedVariation) return buildPriceResponse<number>()

          const selectedSKU = product.variations.find(sku => sku.id === selectedVariation)

          if (!selectedSKU) return buildPriceResponse()

          return buildPriceResponse(
            selectedSKU.price,
            selectedSKU.full_price
          )
        }
      case 'BRLPrices':
        {
          const { price, full_price } = state.prices

          return buildPriceResponse(
            BRLFormatter.format(price),
            BRLFormatter.format(full_price),
          )
        }
      case 'computedFinalPrices':
        {
          const { quantity, prices } = state

          const price = prices.price * quantity
          const full_price = prices.full_price * quantity

          return {
            price: {
              price,
              full_price,
            },
            currency: {
              price: BRLFormatter.format(price),
              full_price: BRLFormatter.format(full_price),
            },
          } satisfies ComputedFinalPrices
        }
      case 'hasSelectedVariation':
        return !isNull(target.selectedVariation)
      default:
        return Reflect.get(target, key)
    }
  },

  set <K extends SingleProductPageStateKeys> (
    target: SingleProductPageState,
    key: K,
    value: SingleProductPageState[K]
  ): boolean {
    const isApplied = Reflect.set(target, key, value)

    switch (key) {
      case 'quantity':
        changeTextContent(renderQuantityElement, String(value ?? 1))
        renderProductPrice()
        break
      case 'selectedVariation':
        renderProductVariations()
        Reflect.set(state, 'quantity' satisfies SingleProductPageStateKeys, 1)
        break
      case 'stockCount':
        // renderStockElements()
        changeProductQuantity(0)
        break
      case 'product':
        {
          const product = value as Nullable<SingleProductPageProduct>

          Reflect.set(state, 'stockCount' satisfies SingleProductPageStateKeys, product?.stock_quantity ?? 0) // TODO: product.stock_quantity
          Reflect.set(state, 'selectedVariation' satisfies SingleProductPageStateKeys, product?.variations[0].id ?? NULL_VALUE)
        }
    }

    return isApplied
  }
}) as (SingleProductPageState & SingleProductPageStateHandler)

const maxAvailableProductsElement = querySelector<'div'>('[data-wtf-error-message-sku-maximum]')
const outtaStockElement = querySelector<'div'>('[data-wtf-error-message-invetory]')

const minusButton = querySelector<'a'>('[data-wtf-quantity-minus]')
const plusButton = querySelector<'a'>('[data-wtf-quantity-plus]')
const renderQuantityElement = querySelector<'div'>('[data-wtf-quantity-value]')

const priceViewer = querySelector('[data-wtf-price]')
const fullPriceViewer = querySelector('[data-wtf-full-price]')
const totalPriceViewer = querySelector('[data-wtf-total]')

const skuList = querySelector('[data-wtf-sku-list]')
const skuItem = querySelector('[data-wtf-sku-item]')

const shippingCalcCTA = querySelector<'a'>('[data-wtf-shipping-button]')

const shippingBlock = querySelector<'div'>('[data-wtf-shipping-form]')

const shippingValue = querySelector<'div'>('[data-wtf-shipping-value]')

const buyButton = querySelector<'a'>('[data-wtf-comprar]')

const quotationErrorMessage = querySelector('[data-wtf-error-message-shipping]')

/**
 * Label que aparece junto aos seletores de peso/quantidade
 */
const variationLabel = querySelector<'div'>('[data-product-sku-label]')

function replaceText (value: string, search: string | RegExp, replacer: string): string {
  return value.replace(search, replacer)
}

function buildPriceResponse <T = number> (
  price: T = 0 as T,
  full_price: T = 0 as T,
): Prices<T> {
  return {
    price,
    full_price,
  }
}

async function getProduct (pathname: GetProductParams['reference_id']): Promise<ResponsePattern<GetProductResponse>> {
  const defaultErrorMessage = 'Houve uma falha ao capturar o produto'

  try {
    const response = await fetch(`${CART_BASE_URL}/product/single-product-page`, {
      ...buildRequestOptions([], REQUEST_POST),
      body: stringify<GetProductParams>({
        quantity: 1,
        reference_id: pathname,
      })
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: GetProductResponse = await response.json()

    return postSuccessResponse.call(response, data) as FunctionSucceededPattern<GetProductResponse>
  } catch (e) {
    return postErrorResponse(defaultErrorMessage)
  }
}

function changeProductQuantity (increment: number): void {
  const newQuantity = increment + state.quantity

  // const maxProductQuantityFromStock = Math.min(state.stockCount, MAX_PRODUCT_QUANTITY)

  const clampedQuantity = clamp(MIN_PRODUCT_QUANTITY, MAX_PRODUCT_QUANTITY, newQuantity)

  if (clampedQuantity === state.quantity) return

  state.quantity = clampedQuantity
}

function changeSelectedVariation (variationID: number) {
  const variationExists = state.product?.variations.some(({ id  }) => id === variationID)

  if (!variationExists) return

  state.selectedVariation = variationID
}

async function buyProduct (event: MouseEvent): Promise<void> {
  event.preventDefault()

  const {
    quantity,
    product,
    selectedVariation
  } = state

  // if (!selectedVariation || !product || state.stockCount === 0) return
  if (!selectedVariation || !product) return

  const response = await addProductToCart({
    quantity,
    sku_id: selectedVariation,
    reference_id: product.slug,
  })

  // TODO: Implementar lógica corretamente
  if (!response.succeeded) {
    return alert('A adição falhou')
  }

  state.quantity = 1

  addClass(querySelector('#carrinho-flutuante'), CART_SWITCH_CLASS)

  localStorage.setItem(STORAGE_KEY_NAME, stringify<CreateCartProduct>(response.data))
}

async function addProductToCart (item: CreateCartProduct): Promise<ResponsePattern<CreateCartProduct>> {
  const defaultErrorMessage = 'Falha ao adicionar o produto'

  try {
    const response = await fetch(`${CART_BASE_URL}/cart/handle`, {
      ...buildRequestOptions([], REQUEST_POST),
      body: stringify<AddToCartParams>({
        item,
        operation: 'add',
      }),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: CreateCartProduct = await response.json()

    return postSuccessResponse.call(response, data) as FunctionSucceededPattern<CreateCartProduct>
  } catch (e) {
    return postErrorResponse(`[CATCH] ${defaultErrorMessage}`)
  }
}

function renderProductVariations (): void {
  if (!skuList || !skuItem || !state.product) return

  const { selectedVariation, product } = state

  const variationsFragment = document.createDocumentFragment()

  const weightSelector = querySelector('[data-wtf-weight-selector]')

  const UNSUFFICIENT_VARIATIONS = state.variationsCount < 2

  // if (UNSUFFICIENT_VARIATIONS) {
  //   return weightSelector?.remove()
  // }

  // toggleClass(weightSelector, GENERAL_HIDDEN_CLASS, UNSUFFICIENT_VARIATIONS)
  toggleClass(weightSelector, GENERAL_HIDDEN_CLASS, false)

  for (const variation of product?.variations) {
    const variationElement = document.createElement('div')

    const isSelected = selectedVariation === variation.id

    addClass(variationElement, 'text-block')

    toggleClass(variationElement, SELECTED_CLASS, isSelected)

    changeTextContent(variationElement, replaceText(variation.label, /\./g, ','))

    if (!isSelected) {
      attachEvent(variationElement, CLICK_EVENT, () => changeSelectedVariation(variation.id))
    }

    variationsFragment.appendChild(variationElement)
  }

  const allVariationsIsUnity = product?.variations.every(({ variation_type }) => variation_type === 'UN')

  if (allVariationsIsUnity) changeTextContent(variationLabel, 'Unidades')

  skuList.replaceChildren(variationsFragment)
}

function renderProductPrice () {
  const product = state.product

  if (!product || !state.hasSelectedVariation) return

  const getPriceViewer = (parent: ReturnType<typeof querySelector>) => querySelector('[data-wtf-price-value]', parent as HTMLElement)

  const {
    BRLPrices,
    hasPriceDifference,
    computedFinalPrices
  } = state

  changeTextContent(getPriceViewer(priceViewer), BRLPrices.price)
  changeTextContent(getPriceViewer(fullPriceViewer), BRLPrices.full_price)
  changeTextContent(getPriceViewer(totalPriceViewer), computedFinalPrices.currency.price)

  toggleClass(priceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference)
  toggleClass(fullPriceViewer, GENERAL_HIDDEN_CLASS, !hasPriceDifference)
}

function renderStockElements () {
  const {
    stockCount,
  } = state

  const hastStock = stockCount < 1

  // toggleClass(querySelector('[data-wtf-shipping]'), GENERAL_HIDDEN_CLASS, hastStock)
  // toggleClass(querySelector('[data-wtf-quantity-selector]'), GENERAL_HIDDEN_CLASS, hastStock)
  // botão de compra não será mais removido devido ao baixo estoque
  // toggleClass(buyButton, GENERAL_HIDDEN_CLASS, hastStock)
  // toggleClass(outtaStockElement, GENERAL_HIDDEN_CLASS, stockCount > 0)

  const hideAvailableMessage = toggleClass(maxAvailableProductsElement, GENERAL_HIDDEN_CLASS, stockCount > 10 || hastStock)

  if (hideAvailableMessage) return

  const maxIndexMessages = objectSize(STOCK_MESSAGE) - 1

  changeTextContent(
    querySelector('div', maxAvailableProductsElement),
    replaceText(
      STOCK_MESSAGE[ clamp(0, maxIndexMessages, stockCount - 1) ],
      COUNTER_REPLACEMENT,
      stockCount.toString(),
    ),
  )
}

function maskCEP (value: string): string {
  return value.replace(/^(\d{0,5})(\d{0,3})/, (
    _: string,
    g1: Nullable<string>,
    g2: Nullable<string>,
  ) => {
    const response: string[] = []

    for (const group of [g1, g2]) {
      group && response.push(group)
    }

    return response.join('-')
  })
}

function startShippingForm () {
  const form = querySelector('form', shippingBlock)

  if (!form) return

  const removalAttributes = [
    'name',
    'method',
    'data-name',
    'aria-label',
    'data-wf-page-id',
    'data-wf-element-id',
    'data-turnstile-sitekey'
  ]

  for (const attribute of removalAttributes) {
    removeAttribute(form, attribute)
  }

  removeClass(shippingBlock, 'w-form')

  const parentElement = form.parentElement as HTMLElement

  parentElement.innerHTML = form.outerHTML

  const updatedForm = querySelector<'form'>('#shipping-cep-form')

  if (!updatedForm) return

  attachEvent(updatedForm, 'input', (e: InputEvent) => {
    e.stopPropagation()

    const target = e.target as HTMLInputElement

    const cleanValue = target.value.replace(/\D+/g, '')

    if (target.name !== 'cep' || target.value === maskCEP(cleanValue) || !e.isTrusted) return

    target.value = maskCEP(cleanValue)

    target.dispatchEvent(new Event('input'))
  })

  attachEvent(updatedForm, 'submit', async (e: SubmitEvent) => {
    e.preventDefault()

    const cep = updatedForm.cep.value

    const response = await deliveryQuotation({
      cep,
      reference_id: slug[objectSize(slug) - 1]
    })

    toggleClass(quotationErrorMessage, GENERAL_HIDDEN_CLASS, response.succeeded)

    if (!response.succeeded) {
      changeTextContent(querySelector('div', quotationErrorMessage), response.message)

      return // TODO: necessário exibir o erro recebido
    }

    switch (response.data.type) {
      case 'quotation':
        return drawQuotation(response.data.data)
      case 'locationlist':
        return drawLocations(response.data.data)
    }
  })
}

function drawQuotation (quotation: QuotationPayload): void {
  addClass(shippingCalcCTA, GENERAL_HIDDEN_CLASS)
  addClass(shippingBlock, GENERAL_HIDDEN_CLASS)

  removeClass(shippingValue, GENERAL_HIDDEN_CLASS)

  const shippingPriceValue = Math.max((quotation.total / 100) - (quotation.has_subsidy ? quotation.subsidy_value : 0), 0)

  // TODO: necessário exibir a data de validade da cotação
  changeTextContent(querySelector('[data-wtf-quotation-price]', shippingValue), shippingPriceValue === 0 ? 'Frete grátis' : BRLFormatter.format(shippingPriceValue))

  attachEvent(querySelector('[data-wtf-quotation-reload]', shippingValue), CLICK_EVENT, (e: MouseEvent) => {
    removeClass(shippingBlock, GENERAL_HIDDEN_CLASS)
    addClass(shippingValue, GENERAL_HIDDEN_CLASS)
  }, { once: true })
}

function drawLocations (locations: LocationList[]): void {
  console.log(objectSize(locations), ' localizações recebidas')
}

async function deliveryQuotation (payload: DeliveryQuotationBody): Promise<ResponsePattern<LocationResponse | QuotationPrice>> {
  const defaultErrorMessage = 'Houve uma falha ao gerar a cotação'

  try {
    const response = await fetch(`${XANO_BASE_URL}/api:i6etHc7G/site/product-delivery`, {
      ...buildRequestOptions([], REQUEST_POST),
      body: stringify<DeliveryQuotationBody>(payload),
    })

    if (!response.ok) {
      const error = await response.json()

      return postErrorResponse.call(response, error?.message ?? defaultErrorMessage)
    }

    const data: LocationResponse | QuotationPrice = await response.json()

    return postSuccessResponse.call(response, data) as FunctionSucceededPattern<LocationResponse | QuotationPrice>
  } catch (error) {
    return postErrorResponse(defaultErrorMessage)
  }
}

getProduct(slug[objectSize(slug) - 1])
  .then(response => {
    if (!response.succeeded) return

    state.product = response.data.product

    const delivery = response.data.delivery

    if (!isNull(delivery)) {
      startShippingForm()

      drawQuotation(delivery as QuotationPayload)
    }
  })
  .then(() => {
    attachEvent(plusButton, CLICK_EVENT, () => changeProductQuantity(1))
    attachEvent(minusButton, CLICK_EVENT, () => changeProductQuantity(-1))

    attachEvent(buyButton, CLICK_EVENT, buyProduct)

    attachEvent(shippingCalcCTA, CLICK_EVENT, (e: MouseEvent) => {
      e.preventDefault()

      addClass(shippingCalcCTA, GENERAL_HIDDEN_CLASS)

      removeClass(shippingBlock, GENERAL_HIDDEN_CLASS)

      startShippingForm()
    }, { once: true })
  })
