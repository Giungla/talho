
export type VariationType = 'UN' | 'KG';

export interface PriceGroup {
  /**
   * Preço do produto com desconto
   */
  price: number;
  /**
   * Preço do produto sem desconto
   */
  full_price: number;
}

export interface XanoSKU {
  id: number;
  created_at: number;
  variation_type: VariationType;
  label: string;
  product_id: number;
  price: number;
  full_price: number;
  sale_fraction: number;
}

export interface WebSacProductGroupDescription {
  id: number | null;
  descricao: string | null;
}

export interface WebSacProductEmbalagem {
  unidade: VariationType;
  quantidade: number;
}

export interface WebSacProductFraction {
  codproduto: number;
  codean: string;
  fracao_venda: string | number;
  pesoliq: string | number;
  precovrj: number;
  dthrcriacao: string;
  fotos: any[];
}

export interface WebSacProduct {
  id: number;
  ativo: boolean;
  descricao_completa: string;
  descricao_resumida: string;
  descricao_ecommerce: string;
  gtin: string[];
  peso_variavel: boolean;
  departamento: WebSacProductGroupDescription;
  grupo: WebSacProductGroupDescription;
  subgrupo: WebSacProductGroupDescription;
  marca: WebSacProductGroupDescription;
  familia: WebSacProductGroupDescription;
  similar: WebSacProductGroupDescription;
  equivalente: WebSacProductGroupDescription;
  embalagem_compra: WebSacProductEmbalagem;
  embalagem_venda: WebSacProductEmbalagem;
  peso_bruto: string | number;
  peso_liquido: string | number;
  altura: null;
  largura: null;
  comprimento: null;
  complemento: string;
  especificacao_tecnica: string;
  especificacao_resumida: string;
  meses_garantia: null | number;
  palavras_chaves: null | string;
  fracao_venda: string | number;
  fracoes_venda: WebSacProductFraction[];
  preco_varejo: string | number;
  preco_varejo_oferta: string | number;
  preco_atacado: string | number;
  preco_atacado_oferta: string | number;
  custo_tabela: string | number;
  custo_reposicao: string | number;
  custo_reposicao_medio: string | number;
  custo_fiscal: string | number;
  custo_fiscal_medio: string | number;
  estoque_atual: number;
  previsao_entrada: string | number;
  previsao_saida: string | number;
}


export interface SKUResponse {
  id: number;
  variation_type: VariationType;
  label: string;
  product_id: number;
  price: PriceGroup['price'];
  full_price: PriceGroup['full_price'];
  sale_fraction: null | number;
}

export interface ProductResponse {
  id: number;
  websac_id: number;
  updated_at: number;
  title: string;
  sync_required: boolean;
  stock_quantity: WebSacProduct['estoque_atual'];
}
