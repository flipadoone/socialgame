/**
 * Comentário retornado pela API.
 */
export interface Comment {
  id: string;
  incidentId: string;
  author: string;
  message: string;
  createdAt: string;
}