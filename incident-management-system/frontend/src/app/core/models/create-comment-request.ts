/**
 * Dados enviados ao criar um comentário.
 *
 * O autor é obtido pelo backend por meio do usuário autenticado.
 */
export interface CreateCommentRequest {
  message: string;
}