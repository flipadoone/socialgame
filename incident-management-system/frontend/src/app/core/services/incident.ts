import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response';
import { CreateIncidentRequest } from '../models/create-incident-request';
import {
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus
} from '../models/incident';
import { PageResponse } from '../models/page-response';
import { UpdateIncidentRequest } from '../models/update-incident-request';
import { APP_CONFIG } from '../config/app-config';

export interface IncidentFilters {
  title?: string;
  status?: IncidentStatus | '';
  priority?: IncidentPriority | '';
  category?: IncidentCategory | '';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly apiUrl =
    `${APP_CONFIG.apiUrl}/api/v1/incidents`;

  constructor(private readonly http: HttpClient) {}

  findAll(
    filters: IncidentFilters = {}
  ): Observable<ApiResponse<PageResponse<Incident>>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));

    if (filters.title?.trim()) {
      params = params.set('title', filters.title.trim());
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }

    if (filters.category) {
      params = params.set('category', filters.category);
    }

    return this.http.get<ApiResponse<PageResponse<Incident>>>(
      this.apiUrl,
      { params }
    );
  }

  create(
    request: CreateIncidentRequest
  ): Observable<ApiResponse<Incident>> {
    return this.http.post<ApiResponse<Incident>>(
      this.apiUrl,
      request
    );
  }

  findById(id: string): Observable<ApiResponse<Incident>> {
    return this.http.get<ApiResponse<Incident>>(
      `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }

  update(
    id: string,
    request: UpdateIncidentRequest
  ): Observable<ApiResponse<Incident>> {
    return this.http.put<ApiResponse<Incident>>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      request
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }
}