import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Auth } from './auth';
import { Token } from './token';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let tokenService: Token;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [Auth, Token, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(Token);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save token and user on successful login', () => {
    const user = { id: '1', name: 'Admin', email: 'admin@viaappia.com', active: true, roles: ['ROLE_ADMIN'] };
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const token = `header.${payload}.signature`;

    service
      .login({ email: 'admin@viaappia.com', password: 'Admin@123' })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, message: 'ok', data: { token, tokenType: 'Bearer', user } });

    expect(tokenService.getToken()).toBe(token);
    expect(tokenService.getUser()?.roles).toContain('ROLE_ADMIN');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear the session on logout', () => {
    tokenService.saveToken('a.b.c');
    service.logout();
    expect(tokenService.getToken()).toBeNull();
  });
});
