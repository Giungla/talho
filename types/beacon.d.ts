
export interface BeaconOptions {
  /**
   * Dados que serão enviados
   */
  data?: BodyInit;
  /**
   * Quantidade de tentativas em caso de falha
   */
  retry?: number;
}
