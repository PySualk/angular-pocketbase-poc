import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';

const makeAuthService = (isAuth: boolean) => ({
  isAuthenticated: signal(isAuth),
});

const makeRouter = () => ({
  createUrlTree: vi.fn().mockImplementation((commands: string[]) => commands as unknown as UrlTree),
});

const runGuard = (guard: typeof authGuard, isAuthenticated: boolean): unknown => {
  const authService = makeAuthService(isAuthenticated);
  const router = makeRouter();

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: Router, useValue: router },
    ],
  });

  return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
};

describe('authGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should return true when user is authenticated', () => {
    const result = runGuard(authGuard, true);
    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when user is not authenticated', () => {
    const result = runGuard(authGuard, false);
    expect(result).not.toBe(true);
    expect(result).toEqual(['/auth/login']);
  });
});

describe('guestGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should return true when user is not authenticated', () => {
    const result = runGuard(guestGuard, false);
    expect(result).toBe(true);
  });

  it('should redirect to / when user is already authenticated', () => {
    const result = runGuard(guestGuard, true);
    expect(result).not.toBe(true);
    expect(result).toEqual(['/']);
  });
});
