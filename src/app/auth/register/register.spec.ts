import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { RegisterComponent } from './register';
import { AuthService } from '../auth.service';

const makeAuthService = () => ({
  register: vi.fn().mockResolvedValue(undefined),
});

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: ReturnType<typeof makeAuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = makeAuthService();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should call authService.register() and navigate to / on valid submission', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    setField('email', 'user@example.com');
    setField('password', 'password123');
    setField('passwordConfirm', 'password123');
    await submitForm();

    expect(authService.register).toHaveBeenCalledWith('user@example.com', 'password123', 'password123');
    expect(navSpy).toHaveBeenCalledWith(['/']);
  });

  it('should show validation error when passwords do not match', async () => {
    setField('email', 'user@example.com');
    setField('password', 'password123');
    setField('passwordConfirm', 'different');
    await submitForm();

    expect(authService.register).not.toHaveBeenCalled();
    expect(text()).toMatch(/passwords do not match/i);
  });

  it('should show validation error when password is too short', async () => {
    setField('email', 'user@example.com');
    setField('password', 'short');
    setField('passwordConfirm', 'short');
    await submitForm();

    expect(authService.register).not.toHaveBeenCalled();
    expect(text()).toMatch(/at least 8/i);
  });

  it('should show server error on duplicate email', async () => {
    authService.register = vi.fn().mockRejectedValue({ status: 400, message: 'Email already in use' });
    setField('email', 'existing@example.com');
    setField('password', 'password123');
    setField('passwordConfirm', 'password123');
    await submitForm();

    expect(text()).toMatch(/email already in use/i);
  });

  it('should disable form during submission', async () => {
    let resolveRegister!: () => void;
    authService.register = vi.fn().mockReturnValue(new Promise<void>((res) => (resolveRegister = res)));

    setField('email', 'user@example.com');
    setField('password', 'password123');
    setField('passwordConfirm', 'password123');

    const form = el().querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const submitBtn = el().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submitBtn.disabled).toBe(true);
    resolveRegister();
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
