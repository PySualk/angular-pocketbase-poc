import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfirmResetComponent } from './confirm-reset';
import { AuthService } from '../auth.service';

const makeAuthService = () => ({
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined),
});

describe('ConfirmResetComponent', () => {
  let fixture: ComponentFixture<ConfirmResetComponent>;
  let authService: ReturnType<typeof makeAuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = makeAuthService();

    await TestBed.configureTestingModule({
      imports: [ConfirmResetComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmResetComponent);
    fixture.componentRef.setInput('token', 'valid-token');
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should call authService.confirmPasswordReset() with token and navigate to /auth/login on success', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    setField('password', 'newpassword123');
    setField('passwordConfirm', 'newpassword123');
    await submitForm();

    expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
      'valid-token',
      'newpassword123',
      'newpassword123',
    );
    expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should show validation error when passwords do not match', async () => {
    setField('password', 'newpassword123');
    setField('passwordConfirm', 'different');
    await submitForm();

    expect(authService.confirmPasswordReset).not.toHaveBeenCalled();
    expect(text()).toMatch(/passwords do not match/i);
  });

  it('should show validation error when password is too short', async () => {
    setField('password', 'short');
    setField('passwordConfirm', 'short');
    await submitForm();

    expect(authService.confirmPasswordReset).not.toHaveBeenCalled();
    expect(text()).toMatch(/at least 8/i);
  });

  it('should show error with link to /auth/login on expired/invalid token', async () => {
    authService.confirmPasswordReset = vi.fn().mockRejectedValue({ status: 400 });
    setField('password', 'newpassword123');
    setField('passwordConfirm', 'newpassword123');
    await submitForm();

    expect(text()).toMatch(/expired|invalid|new link/i);
    const loginLink = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a[href*="login"]');
    expect(loginLink).toBeTruthy();
  });

  it('should disable form during submission', async () => {
    let resolveConfirm!: () => void;
    authService.confirmPasswordReset = vi.fn().mockReturnValue(
      new Promise<void>((res) => (resolveConfirm = res)),
    );

    setField('password', 'newpassword123');
    setField('passwordConfirm', 'newpassword123');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const submitBtn = el().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submitBtn.disabled).toBe(true);
    resolveConfirm();
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
