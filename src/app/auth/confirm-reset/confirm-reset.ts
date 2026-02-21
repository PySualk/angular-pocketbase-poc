import { Component, inject, signal, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-confirm-reset',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-6 text-2xl font-bold">Set New Password</h1>

      <form (submit)="onSubmit($event)">
        <div class="mb-4">
          <label for="password" class="mb-1 block font-medium">New Password</label>
          <input
            id="password"
            name="password"
            type="password"
            (input)="onInput('password', $event)"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-4">
          <label for="passwordConfirm" class="mb-1 block font-medium">Confirm New Password</label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            (input)="onInput('passwordConfirm', $event)"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        @if (error()) {
          <p class="mb-4 text-sm text-red-600" role="alert">
            {{ error() }}
            @if (tokenExpired()) {
              <a routerLink="/auth/login" class="ml-1 text-blue-600 hover:underline">Back to sign in</a>
            }
          </p>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting() ? 'Saving…' : 'Set New Password' }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm">
        <a routerLink="/auth/login" class="text-blue-600 hover:underline">Back to sign in</a>
      </p>
    </div>
  `,
})
export class ConfirmResetComponent {
  @Input() token = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly tokenExpired = signal(false);

  private readonly fields = { password: '', passwordConfirm: '' };

  onInput(field: 'password' | 'passwordConfirm', event: Event): void {
    this.fields[field] = (event.target as HTMLInputElement).value;
    this.error.set('');
    this.tokenExpired.set(false);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const { password, passwordConfirm } = this.fields;

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
      await this.authService.confirmPasswordReset(this.token, password, passwordConfirm);
      await this.router.navigate(['/auth/login']);
    } catch {
      this.tokenExpired.set(true);
      this.error.set('Reset link has expired or is invalid. Please request a new one.');
    } finally {
      this.submitting.set(false);
    }
  }
}
