import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginRequest } from '../../core/models/login-request';
import { Auth } from '../../core/services/auth';

/**
 * Página responsável pela autenticação do usuário.
 */
@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loading = false;
  errorMessage = '';

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8)
      ]
    })
  });

  constructor(
    private readonly authService: Auth,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  /**
   * Autentica o usuário e o direciona para a rota originalmente
   * solicitada ou, por padrão, para o dashboard.
   */
  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request: LoginRequest = this.form.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.loading = false;

        const returnUrl =
          this.activatedRoute.snapshot.queryParamMap.get('returnUrl');

        void this.router.navigateByUrl(
          this.getSafeReturnUrl(returnUrl)
        );
      },

      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Não foi possível conectar ao servidor.';
          return;
        }

        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'E-mail ou senha inválidos.';
          return;
        }

        this.errorMessage =
          error.error?.message ??
          'Não foi possível realizar o login.';
      }
    });
  }

  /**
   * Evita redirecionamentos externos ou URLs maliciosas.
   *
   * Somente caminhos internos iniciados por uma única barra
   * são aceitos.
   */
  private getSafeReturnUrl(returnUrl: string | null): string {
    if (
      returnUrl &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//')
    ) {
      return returnUrl;
    }

    return '/dashboard';
  }

  get emailInvalid(): boolean {
    const field = this.form.controls.email;

    return field.invalid && (
      field.dirty ||
      field.touched
    );
  }

  get passwordInvalid(): boolean {
    const field = this.form.controls.password;

    return field.invalid && (
      field.dirty ||
      field.touched
    );
  }
}