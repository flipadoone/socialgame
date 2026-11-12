import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response';
import { Comment } from '../models/comment';
import { CreateCommentRequest } from '../models/create-comment-request';
import { APP_CONFIG } from '../config/app-config';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly apiUrl =
    `${APP_CONFIG.apiUrl}/api/v1/incidents`;

  constructor(
    private readonly http: HttpClient
  ) {}

  /**
   * Lista os comentários de uma demanda.
   */
  findAllByIncidentId(
    incidentId: string
  ): Observable<ApiResponse<Comment[]>> {
    const encodedIncidentId =
      encodeURIComponent(incidentId);

    return this.http.get<ApiResponse<Comment[]>>(
      `${this.apiUrl}/${encodedIncidentId}/comments`
    );
  }

  /**
   * Cria um comentário em uma demanda.
   */
  create(
    incidentId: string,
    request: CreateCommentRequest
  ): Observable<ApiResponse<Comment>> {
    const encodedIncidentId =
      encodeURIComponent(incidentId);

    const normalizedRequest: CreateCommentRequest = {
      message: request.message.trim()
    };

    return this.http.post<ApiResponse<Comment>>(
      `${this.apiUrl}/${encodedIncidentId}/comments`,
      normalizedRequest
    );
  }
}