import {
  type Nullable,
} from '../global'

export interface ShortenerEntry {
  /**
   * ID do registro na base de dados
   */
  id: number;
  /**
   * Timestamp de criação do registro
   */
  created_at: number;
  /**
   * Código único de recuperação do registro
   */
  code: string;
  /**
   * ID do usuário que gerou este registro, se houver
   */
  user_id: Nullabke<number>;
  /**
   * URL que foi usada para gerar o registro
   */
  original_url: string;
  /**
   * Timestamp de expiração do registro, se houver
   */
  expires_at: Nullable<number>;
  /**
   * Indica quantos acessos o registro recebeu desde sua criação
   */
  access_count: number;
  /**
   * Timestamp do último acesso deste registro, será igual ao `created_at` se nenhum acesso tiver sido realizado
   */
  last_access_at: number;
}

export type ShortenerEntryResponseItem = Pick<ShortenerEntry, 'original_url'>;
