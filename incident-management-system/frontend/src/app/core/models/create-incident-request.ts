import {
  IncidentCategory,
  IncidentPriority
} from './incident';

/**
 * Dados necessários para registrar uma nova demanda.
 *
 * O status inicial é definido pelo backend como OPEN.
 */
export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: IncidentPriority;
  category: IncidentCategory;
  location: string;
}