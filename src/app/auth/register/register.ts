import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-6 text-2xl font-bold">Create Account</h1>

      <form (submit)="onSubmit($event)">
        <div class="mb-4">
          <label for="email" class="mb-1 block font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            (input)="onInput('email', $event)"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-4">
          <label for="password" class="mb-1 block font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            (input)="onInput('password', $event)"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-4">
          <label for="passwordConfirm" class="mb-1 block font-medium">Confirm Password</label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            (input)="onInput('passwordConfirm', $event)"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        @if (error()) {
          <p class="mb-4 text-sm text-red-600" role="alert">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting() ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        Already have an account? <a routerLink="/auth/login" class="text-blue-600 hover:underline">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal('');

  private readonly fields = { email: '', password: '', passwordConfirm: '' };

  onInput(field: 'email' | 'password' | 'passwordConfirm', event: Event): void {
    this.fields[field] = (event.target as HTMLInputElement).value;
    this.error.set('');
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const { email, password, passwordConfirm } = this.fields;

    if (password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    try {
      await this.authService.register(email, password, passwordConfirm);
      await this.router.navigate(['/']);
    } catch (err: unknown) {
      this.error.set(this.extractMessage(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private extractMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Registration failed. Please try again.';
  }
}
