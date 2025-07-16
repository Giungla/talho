import {PriceGroup, XanoSKU} from "./websac";

const response = []

function decimalRound (value, decimalCount = 0) {
  const factor = Math.pow(10, decimalCount)

  return Math.round(value * factor) / factor
}

if ($var.hasManySKUs) {
  const skus = $var.sliced_item.fracoes_venda

  for (let index = 0, len = skus.length; index < len; index++) {
    const selectedSku = skus.at(index)

    /** @type {'KG' | 'UN'} */
    const sellUnity = $var.sliced_item.embalagem_venda.unidade

    /** @type {number} */
    const sellFraction = decimalRound(selectedSku.fracao_venda, 3)

    /**
     * @description Preço sem desconto
     * @type {number}
     */
    const fullPrice = decimalRound($var.sliced_item.preco_varejo, 2)

    /**
     * @description Preço com desconto
     * @type {number}
     */
    const price = decimalRound($var.sliced_item.preco_varejo_oferta, 2)

    /** @type {{price: number, full_price: number}} */
    const prices = {
      price: price === 0
        ? fullPrice
        : price,
      full_price: fullPrice
    }

    const _price = sellUnity === 'UN'
      ? prices.price
      : Math.ceil(decimalRound(sellFraction * prices.price, 2))

    const _fullPrice = sellUnity === 'UN'
      ? prices.full_price
      : Math.ceil(decimalRound(sellFraction * prices.full_price, 2))

    response.push({
      sale_fraction: sellUnity === 'UN'
        ? null
        : sellFraction,
      price: _price,
      full_price: _fullPrice,
      variation_type: sellUnity,
      label: sellUnity === 'UN'
        ? `${$var.sliced_item.embalagem_venda.quantidade} UN`
        : `${sellFraction}KG`,
      product_id: $var.created_product.id,
    })
  }

  return response
}

/** @type {'KG' | 'UN'} */
const sellUnity = $var.sliced_item.embalagem_venda.unidade

/** @type {number} */
const sellFraction = decimalRound($var.sliced_item.fracao_venda, 3)

/**
 * @description Preço sem desconto
 * @type {number}
 */
const fullPrice = decimalRound($var.sliced_item.preco_varejo, 2)

/**
 * @description Preço com desconto
 * @type {number}
 */
const price = decimalRound($var.sliced_item.preco_varejo_oferta, 2)

const prices = {
  price: price === 0
    ? fullPrice
    : price,
  full_price: fullPrice,
}

const _price = sellUnity === 'UN'
  ? prices.price
  : Math.ceil(decimalRound(sellFraction * prices.price, 2))

const _fullPrice = sellUnity === 'UN'
  ? prices.full_price
  : Math.ceil(decimalRound(sellFraction * prices.full_price, 2))

response.push({
  sale_fraction: sellUnity === 'UN'
    ? null
    : sellFraction,
  price: _price,
  full_price: _fullPrice,
  variation_type: sellUnity,
  label: sellUnity === 'UN'
    ? `${$var.sliced_item.embalagem_venda.quantidade} UN`
    : `${sellFraction}KG`,
  product_id: $var.created_product.id,
})

return response

/** --------------------------------------------------------------------- */

if not peso_variavel:
  atualiza sku
  atualiza produto
  return
else:
  if has_many_fractions and xano_has_many_fractions:
    if weights_match:
      atualiza skus
      atualiza produto
      return
    else:
      desativa skus não encontrados
      cria os novos skus necessarios
      atualiza o produto
      return
  else if has_many_fractions and not xano_has_many_fractions:
    if sku_existeste está no websac:
      mantem
    else:
      desativa
    cria os novos skus necessários
    atualiza o produto
    return
  else if not has_many_fractions and xano_has_many_fractions:
    desativa skus não encontrados
    if variação_ativa esta no xano
      atualiza variação
    else
      cria variação
    atualiza produto
    return

/**
 * @param value        {number}
 * @param decimalCount {number}
 * @returns            {number}
 */
function decimalRound (value, decimalCount = 0) {
  const factor = Math.pow(10, decimalCount)

  return Math.round(value * factor) / factor
}

/**
 * @param product {WebSacProduct}
 * @returns       {PriceGroup}
 */
function getWebsacProductPrices (product) {
  const price = decimalRound(Number(product.preco_varejo_oferta), 2)

  const fullPrice = decimalRound(Number(product.preco_varejo), 2)

  /** @type {PriceGroup} */
  return {
    price: price === 0
      ? fullPrice
      : price,
    full_price: fullPrice,
  }
}

/**
 * @description Indica a quantidade de SKUs presente no Websac
 * @type {boolean}
 */
const hasManySKUsAtWebsac = $var.websac_has_many_skus

/** @type {WebSacProduct} */
const websacProduct = $input.product

/**
 * @description Indica a quantidade de SKUs presente no Xano
 * @type {boolean}
 */
const hasMySKUsAtXano = $var.sku_list.length > 1

/** @type {XanoSKU[]} */
const xano_sku_list = $var.sku_list

/**
 * @description Indica se Xano e Websac possuem a mesma quantidade de SKUs
 * @type {boolean}
 */
const sameFractionCount = xano_sku_list.length === websacProduct.fracoes_venda.length

/** @type {number} */
const CURRENT_PRODUCT_ID = $var.xano_product_id

/** @type {ProductResponse[]} */
const product_response = []
/** @type {SKUResponse[]} */
const skus_response = []
/** @type {number[]} */
const skus_response_delete = []
/** @type {Omit<SKUResponse, 'id'>[]} */
const skus_response_create = []

function responseObj () {
  return {
    skus: skus_response,
    create: skus_response_create,
    delete: skus_response_delete,
    product: product_response,
  }
}

if (!websacProduct.peso_variavel) {
  const prices = getWebsacProductPrices(websacProduct)

  skus_response.push({
    id: xano_sku_list[0].id,
    variation_type: websacProduct.embalagem_venda.unidade,
    label: `${websacProduct.embalagem_venda.quantidade} UN`,
    product_id: CURRENT_PRODUCT_ID,
    price: prices.price,
    full_price: prices.full_price,
    sale_fraction: null,
  })

  product_response.push({
    id: CURRENT_PRODUCT_ID,
    updated_at: Date.now(),
    websac_id: websacProduct.id,
    title: websacProduct.descricao_resumida,
    sync_required: true,
    stock_quantity: Math.max(Number(websacProduct.estoque_atual), 0),
  })

  return responseObj()
} else {
  if (hasManySKUsAtWebsac && hasMySKUsAtXano) {
    const websacWeightList = websacProduct.fracoes_venda.map(fraction => decimalRound(Number(fraction.fracao_venda), 2))

    if (sameFractionCount && xano_sku_list.every(({ sale_fraction }) => websacWeightList.includes(decimalRound(sale_fraction, 2)))) {
      for (let index = 0, len = xano_sku_list.length; index++ < len;) {
        const selectedSKU = xano_sku_list.at(index)

        if (!selectedSKU) continue

        const selectedFraction = websacProduct.fracoes_venda.find(fraction => Number(fraction.fracao_venda) === selectedSKU.sale_fraction)

        if (!selectedFraction) continue

        const fraction = decimalRound(Number(selectedFraction.fracao_venda), 2)

        const { price, full_price } = getWebsacProductPrices(websacProduct)

        skus_response.push({
          id: selectedSKU.id,
          variation_type: websacProduct.embalagem_venda.unidade,
          label: `${fraction} ${websacProduct.embalagem_venda.unidade}`,
          price: decimalRound(price * fraction, 2),
          full_price: decimalRound(full_price * fraction, 2),
          product_id: CURRENT_PRODUCT_ID,
          sale_fraction: fraction,
        })
      }

      product_response.push({
        id: CURRENT_PRODUCT_ID,
        updated_at: Date.now(),
        websac_id: websacProduct.id,
        title: websacProduct.descricao_resumida,
        sync_required: true,
        stock_quantity: Math.max(Number(websacProduct.estoque_atual), 0),
      })

      return responseObj()
    } else {
      const notFoundSKUs = xano_sku_list.filter(sku => !websacWeightList.includes(decimalRound(sku.sale_fraction, 2)))

      for (const product of notFoundSKUs) {
        if (skus_response_delete.includes(product.id)) continue

        skus_response_delete.push(product.id)
      }

      const newFractions = websacProduct.fracoes_venda.filter(fraction => {
        return xano_sku_list.find(p => p.sale_fraction === Number(fraction.fracao_venda))
      })

      const { price, full_price } = getWebsacProductPrices(websacProduct)

      for (const fraction of newFractions) {
        const fraction = decimalRound(Number(fraction.fracao_venda), 2)

        skus_response_create.push({
          variation_type: websacProduct.embalagem_venda.unidade,
          label: `${decimalRound(Number(fraction.fracao_venda), 2)} ${websacProduct.embalagem_venda.unidade}`,
          price: decimalRound(price * fraction, 2),
          full_price: decimalRound(full_price * fraction, 2),
          product_id: CURRENT_PRODUCT_ID,
          sale_fraction: fraction,
        })
      }

      product_response.push({
        id: CURRENT_PRODUCT_ID,
        updated_at: Date.now(),
        websac_id: websacProduct.id,
        title: websacProduct.descricao_resumida,
        sync_required: true,
        stock_quantity: Math.max(Number(websacProduct.estoque_atual), 0),
      })

      return responseObj()
    }
  } else if (hasManySKUsAtWebsac && !hasMySKUsAtXano) {
    const foundedVariation = websacProduct.fracoes_venda.find(fraction => decimalRound(Number(fraction.fracao_venda), 2) === xano_sku_list.at(0).sale_fraction)

    const { price, full_price } = getWebsacProductPrices(websacProduct)

    if (!foundedVariation) {
      skus_response_delete.push(xano_sku_list[0].id)
    } else {
      const fracao_venda = decimalRound(Number(foundedVariation.fracao_venda), 2)

      skus_response.push({
        id: xano_sku_list.at(0).id,
        variation_type: websacProduct.embalagem_venda.unidade,
        label: `${fracao_venda} ${websacProduct.embalagem_venda.unidade}`,
        price: decimalRound(price * fracao_venda, 2),
        full_price: decimalRound(full_price * fracao_venda, 2),
        sale_fraction: fracao_venda,
        product_id: CURRENT_PRODUCT_ID,
      })
    }

    const websacVariationsRemain = websacProduct.fracoes_venda.filter(fraction => fraction.fracao_venda !== foundedVariation.fracao_venda)

    for (const variation of websacVariationsRemain) {
      const fracao_venda = decimalRound(Number(variation.fracao_venda), 2)

      skus_response_create.push({
        price: decimalRound(price * fracao_venda, 2),
        full_price: decimalRound(full_price * fracao_venda, 2),
        label: `${fracao_venda} ${websacProduct.embalagem_venda.unidade}`,
        variation_type: websacProduct.embalagem_venda.unidade,
        sale_fraction: fracao_venda,
        product_id: CURRENT_PRODUCT_ID,
      })
    }

    product_response.push({
      id: CURRENT_PRODUCT_ID,
      updated_at: Date.now(),
      websac_id: websacProduct.id,
      title: websacProduct.descricao_resumida,
      sync_required: true,
      stock_quantity: Math.max(Number(websacProduct.estoque_atual), 0),
    })

    return responseObj()
  } else if (!hasManySKUsAtWebsac && hasMySKUsAtXano) {
    const fracao_existente = decimalRound(Number(websacProduct.fracao_venda), 2)

    const disableList = xano_sku_list.filter(sku => {
      return fracao_existente !== sku.sale_fraction
    })

    for (const sku of disableList) {
      if (skus_response_delete.includes(sku.id)) continue

      skus_response_delete.push(sku.id)
    }

    const variacaoExiste = xano_sku_list.find(sku => {
      return fracao_existente === sku.sale_fraction && !skus_response_delete.includes(sku.id)
    })

    const { price, full_price } = getWebsacProductPrices(websacProduct)

    if (variacaoExiste) {
      skus_response.push({
        id: variacaoExiste.id,
        product_id: CURRENT_PRODUCT_ID,
        sale_fraction: variacaoExiste.sale_fraction,
        price: decimalRound(price * variacaoExiste.sale_fraction, 2),
        full_price: decimalRound(full_price * variacaoExiste.sale_fraction, 2),
        label: `${variacaoExiste.sale_fraction} ${websacProduct.embalagem_venda.unidade}`,
        variation_type: websacProduct.embalagem_venda.unidade,
      })
    } else {
      skus_response_create.push({
        product_id: CURRENT_PRODUCT_ID,
        sale_fraction: variacaoExiste.sale_fraction,
        price: decimalRound(price * variacaoExiste.sale_fraction, 2),
        full_price: decimalRound(full_price * variacaoExiste.sale_fraction, 2),
        label: `${variacaoExiste.sale_fraction} ${websacProduct.embalagem_venda.unidade}`,
        variation_type: websacProduct.embalagem_venda.unidade,
      })
    }

    product_response.push({
      id: CURRENT_PRODUCT_ID,
      updated_at: Date.now(),
      websac_id: websacProduct.id,
      title: websacProduct.descricao_resumida,
      sync_required: true,
      stock_quantity: Math.max(Number(websacProduct.estoque_atual), 0),
    })

    return responseObj()
  }

  return responseObj()
}
























/**
 * Se `true` apenas o periodo da tarde está disponível, se `false` ambos os períodos estão disponíveis
 */
const currentPeriod = $input.integer_hour >= 14

let periodsCount: number | null = null;

/**
 * Horário em que as entregas começam a ser realizadas
 */
const startingDeliveryHour: number = 10

let currentDeliveryHour: number = startingDeliveryHour

const deliveryInterval = 2

switch ($var.week_day) {
  // Sunday
  case '7':
    periodsCount = 2
    break
  // Saturday
  case '6':
    periodsCount = 3
    break
  // Friday
  case '5':
    periodsCount = 4
    break
  // Tuesday
  // Wednesday
  // Thursday
  // Monday
  default:
    periodsCount = 4
}

const _response = []

do {
  _response.push({
    token: `teste`,
    label: `${currentDeliveryHour}:00`,
    period: _response.length < 2 ? 'P1' : 'P2'
  })

  currentDeliveryHour += deliveryInterval
} while (periodsCount > _response.length)

return _response



























