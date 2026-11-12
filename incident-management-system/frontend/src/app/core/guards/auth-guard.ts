import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth';

/** Bloqueia rotas privadas: sem sessão válida, redireciona ao login guardando a rota pedida. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
};

/** Quem já está autenticado não precisa ver a tela de login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
