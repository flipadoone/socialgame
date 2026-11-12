/**
 * Representa os dados públicos do usuário autenticado.
 *
 * A senha nunca deve fazer parte deste modelo.
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: string[];
}