import {
  IncidentCategory,
  IncidentPriority,
  IncidentStatus
} from './incident';

/**
 * Dados enviados ao atualizar uma demanda existente.
 *
 * O backend exige todos os campos editáveis no PUT.
 */
export interface UpdateIncidentRequest {
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: IncidentCategory;
  location: string;
}