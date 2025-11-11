
export const OrderPrepareStatus = ({
  /**
   * Representa os pedidos criados e ainda não movimentados
   */
  NOTSTARTED: 'NOTSTARTED',
  /**
   * Representa os pedidos que foram preparados
   */
  PREPARED: 'PREPARED',
  /**
   * Representa os pedidos que estão sendo preparados
   */
  PREPARING: 'PREPARING',
  /**
   * Representa os pedidos prontos para entrega
   */
  DELIVERYREADY: 'DELIVERYREADY',
}) as const

export type OrderPrepareStatus     = typeof OrderPrepareStatus;
export type OrderPrepareStatusKeys = OrderPrepareStatus[keyof typeof OrderPrepareStatus];

export const OrderStatus = ({
  /**
   * Representa um pedido entregue
   */
  COMPLETED: 'COMPLETED',
  /**
   * Representa um pedido que ainda está em busca de um motorista
   */
  ASSIGNING_DRIVER: 'ASSIGNING_DRIVER',
  /**
   * Representa um pedido cancelado
   */
  CANCELED: 'CANCELED',
  /**
   * Representa um pedido a caminho da entrega
   */
  ON_GOING: 'ON_GOING',
  /**
   * Representa um pedido retirado pelo motorista
   */
  PICKED_UP: 'PICKED_UP',
  /**
   * Representa um pedido rejeitado
   */
  REJECTED: 'REJECTED',
  /**
   * Represneta um pedido expirado
   */
  EXPIRED: 'EXPIRED',
}) as const

export type OrderStatus     = typeof OrderStatus;
export type OrderStatusKeys = OrderStatus[keyof typeof OrderStatus];