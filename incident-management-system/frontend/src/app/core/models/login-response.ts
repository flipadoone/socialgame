import { UserResponse } from './user-response';

/**
 * Representa os dados retornados dentro da propriedade `data`
 * após uma autenticação realizada com sucesso.
 */
export interface LoginResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}