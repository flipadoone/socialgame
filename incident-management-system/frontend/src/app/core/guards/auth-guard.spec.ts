import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { authGuard } from './auth-guard';
import { Token } from '../services/token';

describe('authGuard', () => {
  const run = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should redirect to /login keeping the requested url when there is no session', () => {
    const result = run('/dashboard') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('should allow navigation with a valid session', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    TestBed.inject(Token).saveToken(`h.${btoa(JSON.stringify({ exp }))}.s`);
    expect(run('/dashboard')).toBe(true);
  });
});
