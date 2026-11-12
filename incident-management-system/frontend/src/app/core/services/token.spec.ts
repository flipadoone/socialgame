import { TestBed } from '@angular/core/testing';
import { Token } from './token';

describe('Token', () => {
  let service: Token;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Token);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve the token correctly', () => {
    const mockToken = 'mock-jwt-token-habbo-123';
    
    service.saveToken(mockToken);
    
    expect(service.getToken()).toBe(mockToken);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should remove session data properly', () => {
    service.saveToken('token-para-remover');
    expect(service.isAuthenticated()).toBe(true);

    service.removeSession();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
describe('Token (expiração e perfil)', () => {
  let service: Token;

  const makeToken = (expSecondsFromNow: number) =>
    `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))}.s`;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Token);
    localStorage.clear();
  });

  it('should treat an expired token as unauthenticated and clear it', () => {
    service.saveToken(makeToken(-60));
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('should accept a token that has not expired', () => {
    service.saveToken(makeToken(3600));
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should detect the admin role', () => {
    service.saveUser({ id: '1', name: 'A', email: 'a@a.com', active: true, roles: ['ROLE_ADMIN'] });
    expect(service.isAdmin()).toBe(true);
    service.saveUser({ id: '2', name: 'B', email: 'b@a.com', active: true, roles: ['ROLE_USER'] });
    expect(service.isAdmin()).toBe(false);
  });
});
