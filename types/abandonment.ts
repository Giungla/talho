
export interface CartAbandonmentParams {
  /**
   * Nome do campo que está sendo registrado
   */
  field: AbandonmentFieldsNames;
  /**
   * Valor que será atribuído ao campo
   */
  value: string;
}

export const AbandonmentFields = ({
  /**
   * Nome do usuário
   */
  USERNAME: 'user_name',
  /**
   * Número de telefone formatado
   */
  PHONE: 'phone',
  /**
   * Endereço de e-mail do usuário
   */
  EMAIL: 'email',
  /**
   * CEP de entrega do usuário
   */
  SHIPPING_CEP: 'shipping_cep',
  /**
   * CEP de cobrança do usuário
   */
  BILLING_CEP: 'billing_cep',
}) as const

export type AbandonmentFields = typeof AbandonmentFields
export type AbandonmentFieldsNames = AbandonmentFields[keyof typeof AbandonmentFields]
