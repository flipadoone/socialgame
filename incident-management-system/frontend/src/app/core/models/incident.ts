/**
 * Status possíveis durante o ciclo de vida de uma demanda.
 */
export type IncidentStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

/**
 * Níveis de prioridade aceitos pelo backend.
 */
export type IncidentPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

/**
 * Categorias técnicas aceitas pelo backend.
 */
export type IncidentCategory =
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'NETWORK'
  | 'SECURITY'
  | 'OTHER';

/**
 * Representa uma demanda retornada pela API.
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: IncidentCategory;
  location: string;
  createdAt: string;
  updatedAt: string;
}