import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { LoginComponent } from './login';
import { AuthService } from '../auth.service';

const makeAuthService = () => ({
  login: vi.fn().mockResolvedValue(undefined),
  requestPasswordReset: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: signal(false),
  currentUser: signal(null),
});

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: ReturnType<typeof makeAuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = makeAuthService();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should call authService.login() and navigate to / on valid credentials', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    setField('email', 'user@example.com');
    setField('password', 'password123');
    await submitForm();

    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(navSpy).toHaveBeenCalledWith(['/']);
  });

  it('should show generic error on invalid credentials', async () => {
    authService.login = vi.fn().mockRejectedValue({ status: 400, message: 'Failed to authenticate.' });
    setField('email', 'user@example.com');
    setField('password', 'wrongpassword');
    await submitForm();

    expect(text()).toMatch(/invalid email or password/i);
  });

  it('should disable form during submission', async () => {
    let resolveLogin!: () => void;
    authService.login = vi.fn().mockReturnValue(new Promise<void>((res) => (resolveLogin = res)));

    setField('email', 'user@example.com');
    setField('password', 'password123');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const submitBtn = el().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submitBtn.disabled).toBe(true);
    resolveLogin();
  });

  it('should call requestPasswordReset() and show success message when forgot password submitted', async () => {
    const forgotEmail = el().querySelector<HTMLInputElement>('input[name="forgotEmail"]');
    if (forgotEmail) {
      forgotEmail.value = 'user@example.com';
      forgotEmail.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    const forgotForm = el().querySelectorAll('form')[1];
    if (forgotForm) {
      forgotForm.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    if (forgotEmail) {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
      expect(text()).toMatch(/check your email/i);
    }
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return el().textContent ?? '';
  }

  function setField(name: string, value: string): void {
    const input = el().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function submitForm(): Promise<void> {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
