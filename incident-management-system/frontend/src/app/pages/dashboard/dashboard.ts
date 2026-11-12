import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Comment } from '../../core/models/comment';
import { CreateCommentRequest } from '../../core/models/create-comment-request';
import { CreateIncidentRequest } from '../../core/models/create-incident-request';
import { IncidentStats } from '../../core/models/incident-stats';
import {
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus
} from '../../core/models/incident';
import { UpdateIncidentRequest } from '../../core/models/update-incident-request';
import { UserResponse } from '../../core/models/user-response';

import { Auth } from '../../core/services/auth';
import { CommentService } from '../../core/services/comment';
import {
  IncidentFilters,
  IncidentService
} from '../../core/services/incident';
import { IncidentStatsService } from '../../core/services/incident-stats';
import { GameBridge } from '../../core/services/game-bridge';
import { Token } from '../../core/services/token';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  readonly user: UserResponse | null;

  incidents: Incident[] = [];

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  firstPage = true;
  lastPage = true;

  stats: IncidentStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0
  };

  loading = false;
  statsLoading = false;
  saving = false;
  modalOpen = false;

  modalMode: ModalMode = 'create';
  editingIncidentId: string | null = null;
  actionInProgressId: string | null = null;

  errorMessage = '';
  successMessage = '';
  statsErrorMessage = '';

  /**
   * Comentários carregados para cada demanda.
   */
  readonly commentsByIncident: Record<string, Comment[]> = {};

  /**
   * Controla quais áreas de comentários estão abertas.
   */
  readonly commentsOpen: Record<string, boolean> = {};

  /**
   * Controla o carregamento dos comentários de cada demanda.
   */
  readonly commentsLoading: Record<string, boolean> = {};

  /**
   * Controla o envio de comentário em cada demanda.
   */
  readonly commentsSending: Record<string, boolean> = {};

  /**
   * Mensagem de erro individual para cada área de comentários.
   */
  readonly commentsError: Record<string, string> = {};

  /**
   * Um campo de comentário independente para cada demanda.
   */
  readonly commentControls: Record<
    string,
    FormControl<string>
  > = {};

  readonly filterForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true
    }),

    status: new FormControl<IncidentStatus | ''>('', {
      nonNullable: true
    }),

    priority: new FormControl<IncidentPriority | ''>('', {
      nonNullable: true
    }),

    category: new FormControl<IncidentCategory | ''>('', {
      nonNullable: true
    })
  });

  readonly incidentForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150)
      ]
    }),

    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(2000)
      ]
    }),

    status: new FormControl<IncidentStatus>('OPEN', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    priority: new FormControl<IncidentPriority>('MEDIUM', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    category: new FormControl<IncidentCategory>('HARDWARE', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    location: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(200)
      ]
    })
  });

  constructor(
    private readonly authService: Auth,
    private readonly tokenService: Token,
    private readonly gameBridge: GameBridge,
    private readonly incidentService: IncidentService,
    private readonly incidentStatsService: IncidentStatsService,
    private readonly commentService: CommentService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.user = this.tokenService.getUser();
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadIncidents();
  }

  /** Somente administradores criam, editam, excluem e comentam (o backend também exige). */
  get isAdmin(): boolean {
    return this.user?.roles?.includes('ROLE_ADMIN') ?? false;
  }

  get isEditing(): boolean {
    return this.modalMode === 'edit';
  }

  /**
   * Carrega as estatísticas agregadas das demandas.
   */
  loadStats(): void {
    if (this.statsLoading) {
      return;
    }

    this.statsLoading = true;
    this.statsErrorMessage = '';

    this.incidentStatsService
      .getStats()
      .pipe(
        finalize(() => {
          this.statsLoading = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.stats = response.data ?? {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
            critical: 0
          };

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.statsErrorMessage = this.getErrorMessage(
            error,
            'Não foi possível carregar as estatísticas.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  loadIncidents(): void {
    this.loading = true;
    this.errorMessage = '';

    const filters: IncidentFilters = {
      ...this.filterForm.getRawValue(),
      page: this.currentPage,
      size: this.pageSize
    };

    this.incidentService
      .findAll(filters)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.incidents = response.data.content;
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.firstPage = response.data.first;
          this.lastPage = response.data.last;

          for (const incident of this.incidents) {
            this.ensureCommentControl(incident.id);
          }

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Não foi possível carregar as demandas.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  searchIncidents(): void {
    this.currentPage = 0;
    this.loadIncidents();
  }

  clearFilters(): void {
    this.filterForm.reset({
      title: '',
      status: '',
      priority: '',
      category: ''
    });

    this.currentPage = 0;
    this.loadIncidents();
  }

  previousPage(): void {
    if (this.loading || this.firstPage || this.currentPage <= 0) {
      return;
    }

    this.currentPage -= 1;
    this.loadIncidents();
    this.scrollToDemandList();
  }

  nextPage(): void {
    if (
      this.loading ||
      this.lastPage ||
      this.currentPage >= this.totalPages - 1
    ) {
      return;
    }

    this.currentPage += 1;
    this.loadIncidents();
    this.scrollToDemandList();
  }

  goToPage(page: number): void {
    if (
      this.loading ||
      page < 0 ||
      page >= this.totalPages ||
      page === this.currentPage
    ) {
      return;
    }

    this.currentPage = page;
    this.loadIncidents();
    this.scrollToDemandList();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingIncidentId = null;
    this.successMessage = '';
    this.errorMessage = '';

    this.incidentForm.reset({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'HARDWARE',
      location: ''
    });

    this.modalOpen = true;
    this.changeDetectorRef.markForCheck();
  }

  openEditModal(incident: Incident): void {
    if (this.actionInProgressId !== null) {
      return;
    }

    this.modalMode = 'edit';
    this.editingIncidentId = incident.id;
    this.successMessage = '';
    this.errorMessage = '';

    this.incidentForm.reset({
      title: incident.title,
      description: incident.description,
      status: incident.status,
      priority: incident.priority,
      category: incident.category,
      location: incident.location
    });

    this.modalOpen = true;
    this.changeDetectorRef.markForCheck();
  }

  closeIncidentModal(): void {
    if (this.saving) {
      return;
    }

    this.modalOpen = false;
    this.editingIncidentId = null;
    this.errorMessage = '';

    this.changeDetectorRef.markForCheck();
  }

  saveIncident(): void {
    if (this.incidentForm.invalid || this.saving) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    if (this.isEditing) {
      this.updateIncident();
      return;
    }

    this.createIncident();
  }

  startIncident(incident: Incident): void {
    this.changeIncidentStatus(
      incident,
      'IN_PROGRESS',
      'iniciar o atendimento desta demanda'
    );
  }

  resolveIncident(incident: Incident): void {
    this.changeIncidentStatus(
      incident,
      'RESOLVED',
      'concluir esta demanda'
    );
  }

  reopenIncident(incident: Incident): void {
    this.changeIncidentStatus(
      incident,
      'OPEN',
      'reabrir esta demanda'
    );
  }

  deleteIncident(incident: Incident): void {
    if (this.actionInProgressId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir a demanda "${incident.title}"?\n\n` +
      'Essa ação não poderá ser desfeita.'
    );

    if (!confirmed) {
      return;
    }

    this.actionInProgressId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.incidentService
      .delete(incident.id)
      .pipe(
        finalize(() => {
          this.actionInProgressId = null;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          delete this.commentsByIncident[incident.id];
          delete this.commentsOpen[incident.id];
          delete this.commentsLoading[incident.id];
          delete this.commentsSending[incident.id];
          delete this.commentsError[incident.id];
          delete this.commentControls[incident.id];

          if (this.incidents.length === 1 && this.currentPage > 0) {
            this.currentPage -= 1;
          }

          this.successMessage =
            `Demanda "${incident.title}" excluída com sucesso.`;

          this.loadIncidents();
          this.loadStats();
          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Não foi possível excluir a demanda.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Abre ou fecha a área de comentários.
   *
   * Os comentários são carregados apenas na primeira abertura.
   */
  toggleComments(incident: Incident): void {
    const incidentId = incident.id;
    const willOpen = !this.commentsOpen[incidentId];

    this.commentsOpen[incidentId] = willOpen;
    this.ensureCommentControl(incidentId);

    if (
      willOpen &&
      this.commentsByIncident[incidentId] === undefined
    ) {
      this.loadComments(incidentId);
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * Busca os comentários de uma demanda.
   */
  loadComments(incidentId: string): void {
    if (this.commentsLoading[incidentId]) {
      return;
    }

    this.commentsLoading[incidentId] = true;
    this.commentsError[incidentId] = '';

    this.commentService
      .findAllByIncidentId(incidentId)
      .pipe(
        finalize(() => {
          this.commentsLoading[incidentId] = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.commentsByIncident[incidentId] =
            response.data ?? [];

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.commentsByIncident[incidentId] = [];

          this.commentsError[incidentId] =
            this.getErrorMessage(
              error,
              'Não foi possível carregar os comentários.'
            );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Envia um comentário para uma demanda.
   */
  submitComment(incident: Incident): void {
    const incidentId = incident.id;
    const control = this.getCommentControl(incidentId);

    if (
      control.invalid ||
      this.commentsSending[incidentId]
    ) {
      control.markAsTouched();
      return;
    }

    const normalizedMessage = control.value.trim();

    if (!normalizedMessage) {
      control.setErrors({
        required: true
      });

      control.markAsTouched();
      return;
    }

    const request: CreateCommentRequest = {
      message: normalizedMessage
    };

    this.commentsSending[incidentId] = true;
    this.commentsError[incidentId] = '';

    this.commentService
      .create(incidentId, request)
      .pipe(
        finalize(() => {
          this.commentsSending[incidentId] = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          const currentComments =
            this.commentsByIncident[incidentId] ?? [];

          this.commentsByIncident[incidentId] = [
            ...currentComments,
            response.data
          ];

          control.reset('');

          this.successMessage =
            `Comentário adicionado à demanda "${incident.title}".`;

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.commentsError[incidentId] =
            this.getErrorMessage(
              error,
              'Não foi possível adicionar o comentário.'
            );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Retorna o campo de comentário referente à demanda.
   */
  getCommentControl(
    incidentId: string
  ): FormControl<string> {
    this.ensureCommentControl(incidentId);

    return this.commentControls[incidentId];
  }

  /**
   * Retorna os comentários já carregados.
   */
  getComments(incidentId: string): Comment[] {
    return this.commentsByIncident[incidentId] ?? [];
  }

  /**
   * Retorna a quantidade de comentários carregados.
   */
  getCommentCount(incidentId: string): number {
    return this.getComments(incidentId).length;
  }

  /**
   * Indica se a área de comentários está aberta.
   */
  isCommentsOpen(incidentId: string): boolean {
    return Boolean(this.commentsOpen[incidentId]);
  }

  /**
   * Indica se os comentários estão carregando.
   */
  isCommentsLoading(incidentId: string): boolean {
    return Boolean(this.commentsLoading[incidentId]);
  }

  /**
   * Indica se um comentário está sendo enviado.
   */
  isCommentSending(incidentId: string): boolean {
    return Boolean(this.commentsSending[incidentId]);
  }

  isProcessing(incident: Incident): boolean {
    return this.actionInProgressId === incident.id;
  }

  logout(): void {
    this.authService.logout();
    this.gameBridge.notifyLogout();

    void this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }

  priorityLabel(priority: IncidentPriority): string {
    const labels: Record<IncidentPriority, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      CRITICAL: 'Crítica'
    };

    return labels[priority];
  }

  statusLabel(status: IncidentStatus): string {
    const labels: Record<IncidentStatus, string> = {
      OPEN: 'Aberta',
      IN_PROGRESS: 'Em andamento',
      RESOLVED: 'Resolvida',
      CLOSED: 'Fechada'
    };

    return labels[status];
  }

  categoryLabel(category: IncidentCategory): string {
    const labels: Record<IncidentCategory, string> = {
      HARDWARE: 'Hardware',
      SOFTWARE: 'Software',
      NETWORK: 'Rede',
      SECURITY: 'Segurança',
      OTHER: 'Outro'
    };

    return labels[category];
  }

  trackById(
    _index: number,
    incident: Incident
  ): string {
    return incident.id;
  }

  trackCommentById(
    _index: number,
    comment: Comment
  ): string {
    return comment.id;
  }

  private createIncident(): void {
    this.saving = true;
    this.errorMessage = '';

    const formValue = this.incidentForm.getRawValue();

    const request: CreateIncidentRequest = {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      priority: formValue.priority,
      category: formValue.category,
      location: formValue.location.trim()
    };

    this.incidentService
      .create(request)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.modalOpen = false;
          this.currentPage = 0;

          this.successMessage =
            `Demanda "${response.data.title}" criada com sucesso.`;

          this.loadIncidents();
          this.loadStats();
          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Não foi possível criar a demanda.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private updateIncident(): void {
    if (!this.editingIncidentId) {
      this.errorMessage =
        'Não foi possível identificar a demanda que será editada.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const formValue = this.incidentForm.getRawValue();

    const request: UpdateIncidentRequest = {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      status: formValue.status,
      priority: formValue.priority,
      category: formValue.category,
      location: formValue.location.trim()
    };

    this.incidentService
      .update(this.editingIncidentId, request)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.modalOpen = false;
          this.editingIncidentId = null;

          this.replaceIncident(response.data);

          this.successMessage =
            `Demanda "${response.data.title}" atualizada com sucesso.`;

          this.loadStats();
          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Não foi possível editar a demanda.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private changeIncidentStatus(
    incident: Incident,
    newStatus: IncidentStatus,
    confirmationAction: string
  ): void {
    if (this.actionInProgressId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente ${confirmationAction}?`
    );

    if (!confirmed) {
      return;
    }

    this.actionInProgressId = incident.id;
    this.errorMessage = '';
    this.successMessage = '';

    const request: UpdateIncidentRequest = {
      title: incident.title,
      description: incident.description,
      status: newStatus,
      priority: incident.priority,
      category: incident.category,
      location: incident.location
    };

    this.incidentService
      .update(incident.id, request)
      .pipe(
        finalize(() => {
          this.actionInProgressId = null;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: response => {
          this.replaceIncident(response.data);

          this.successMessage =
            `Demanda "${response.data.title}" atualizada para ` +
            `"${this.statusLabel(response.data.status)}".`;

          this.loadStats();
          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getErrorMessage(
            error,
            'Não foi possível atualizar o status da demanda.'
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private scrollToDemandList(): void {
    window.setTimeout(() => {
      document
        .querySelector('.notice-board')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 0);
  }

  private ensureCommentControl(
    incidentId: string
  ): void {
    if (this.commentControls[incidentId]) {
      return;
    }

    this.commentControls[incidentId] =
      new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(2000)
        ]
      });
  }

  private replaceIncident(
    updatedIncident: Incident
  ): void {
    this.incidents = this.incidents.map(
      currentIncident =>
        currentIncident.id === updatedIncident.id
          ? updatedIncident
          : currentIncident
    );
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallbackMessage: string
  ): string {
    if (error.status === 0) {
      return 'Não foi possível conectar ao backend.';
    }

    if (error.status === 400) {
      return error.error?.message ??
        'Revise os dados informados.';
    }

    if (error.status === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }

    if (error.status === 403) {
      return 'Você não possui permissão para esta operação.';
    }

    if (error.status === 404) {
      return 'A demanda não foi encontrada.';
    }

    if (error.status === 409) {
      return error.error?.message ??
        'A operação não pôde ser concluída devido a um conflito.';
    }

    return error.error?.message ?? fallbackMessage;
  }
}