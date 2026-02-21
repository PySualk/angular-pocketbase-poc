import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-6 text-2xl font-bold">Sign In</h1>

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

        @if (loginError()) {
          <p class="mb-4 text-sm text-red-600" role="alert">{{ loginError() }}</p>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting() ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        No account? <a routerLink="/auth/register" class="text-blue-600 hover:underline">Create one</a>
      </p>

      <details class="mt-6">
        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Forgot password?</summary>
        <form (submit)="onForgotSubmit($event)" class="mt-3">
          <div class="mb-3">
            <label for="forgotEmail" class="mb-1 block text-sm font-medium">Your email address</label>
            <input
              id="forgotEmail"
              name="forgotEmail"
              type="email"
              (input)="onForgotEmailInput($event)"
              class="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          @if (resetSent()) {
            <p class="text-sm text-green-600" role="status">Check your email for a reset link.</p>
          } @else {
            <button
              type="submit"
              [disabled]="resetSubmitting()"
              class="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              {{ resetSubmitting() ? 'Sending…' : 'Send Reset Link' }}
            </button>
            @if (resetError()) {
              <p class="mt-2 text-sm text-red-600" role="alert">{{ resetError() }}</p>
            }
          }
        </form>
      </details>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly loginError = signal('');

  readonly resetSubmitting = signal(false);
  readonly resetSent = signal(false);
  readonly resetError = signal('');

  private readonly fields = { email: '', password: '' };
  private forgotEmail = '';

  onInput(field: 'email' | 'password', event: Event): void {
    this.fields[field] = (event.target as HTMLInputElement).value;
    this.loginError.set('');
  }

  onForgotEmailInput(event: Event): void {
    this.forgotEmail = (event.target as HTMLInputElement).value;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitting.set(true);
    try {
      await this.authService.login(this.fields.email, this.fields.password);
      await this.router.navigate(['/']);
    } catch {
      this.loginError.set('Invalid email or password.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onForgotSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.resetSubmitting.set(true);
    this.resetError.set('');
    try {
      await this.authService.requestPasswordReset(this.forgotEmail);
      this.resetSent.set(true);
    } catch {
      this.resetError.set('Failed to send reset email. Please try again.');
    } finally {
      this.resetSubmitting.set(false);
    }
  }
}
