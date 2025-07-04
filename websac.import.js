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

// if not peso_variavel:
//   atualiza sku
// atualiza produto
// return
// else:
// if has_many_fractions and xano_has_many_fractions:
//   if weights_match:
// atualiza skus
// atualiza produto
// return
// else:
// desativa skus não encontrados
// cria os novos skus necessarios
// atualiza o produto
// return
// else if has_many_fractions and not xano_has_many_fractions:
//   if sku_existeste está no websac:
//   mantem
// else:
// desativa
// cria os novos skus necessários
// atualiza o produto
// return
// else if not has_many_fractions and xano_has_many_fractions:
//   desativa skus não encontrados
// if variação_ativa esta no xano
// atualiza variação
// else
// cria variação
// atualiza produto
// return

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
const hasMySKUsAtXano = $var.sku_list.length > 0

/** @type {XanoSKU[]} */
const xano_sku_list = $var.sku_list

/**
 * @description Indica se Xano e Websac possuem a mesma quantidade de SKUs
 * @type {boolean}
 */
const sameFractionCount = xano_sku_list.length === websacProduct.fracoes_venda.length

/** @type {ProductResponse[]} */
const product_response = []
/** @type {SKUResponse[]} */
const skus_response = []

function responseObj () {
  return {
    skus: skus_response,
    product: product_response,
  }
}

if (!websacProduct.peso_variavel) {
  const prices = getWebsacProductPrices(websacProduct)

  skus_response.push({
    id: xano_sku_list[0].id,
    variation_type: websacProduct.embalagem_venda.unidade,
    label: `${websacProduct.embalagem_venda.quantidade} UN`,
    product_id: $var.xano_product_id,
    price: prices.price,
    full_price: prices.full_price,
    sale_fraction: null,
  })

  product_response.push({
    id: $var.xano_product_id,
    updated_at: Date.now(),
    websac_id: websacProduct.id,
    title: websacProduct.descricao_resumida,
    sync_required: true,
    stock_quantity: websacProduct.estoque_atual,
  })

  return responseObj()
} else {
  if (hasMySKUsAtXano && hasManySKUsAtWebsac) {
    const websacWeightList = websacProduct.fracoes_venda.map(fraction => decimalRound(Number(fraction.fracao_venda), 2))

    if (sameFractionCount && $var.sku_list.every(({ sale_fraction }) => websacWeightList.includes(decimalRound(sale_fraction, 2)))) {
      for (let index = 0, len = $var.sku_list.length; index++ < len;) {
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
          price,
          full_price,
          product_id: 
        })
      }

      skus_response.push({})
    }
  }

  return responseObj()
}


























