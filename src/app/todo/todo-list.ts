import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TodoService } from './todo.service';
import { TodoItemComponent } from './todo-item';
import { BackendErrorComponent } from '../error/backend-error';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-todo-list',
  imports: [TodoItemComponent, BackendErrorComponent],
  template: `
    @if (hasError()) {
      <app-backend-error />
    } @else {
      <div class="mx-auto max-w-xl p-6">
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-2xl font-bold">Todo List</h1>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ authService.currentUser()?.['email'] }}</span>
            <button
              data-testid="sign-out"
              (click)="onSignOut()"
              class="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>

        @if (todoService.loading()) {
          <p class="text-gray-500">Loading...</p>
        } @else if (todoService.todos().length === 0) {
          <p class="text-gray-400">No todos yet. Add one below!</p>
        } @else {
          <ul class="mb-6 space-y-2">
            @for (todo of todoService.todos(); track todo.id) {
              <app-todo-item [todo]="todo" />
            }
          </ul>
        }

        <form (submit)="onSubmit($event)" class="flex flex-col gap-2">
          <label for="new-todo" class="font-medium">New Todo</label>
          <div class="flex gap-2">
            <input
              id="new-todo"
              type="text"
              [value]="titleValue()"
              (input)="onTitleInput($event)"
              placeholder="What needs to be done?"
              class="flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="New todo title"
            />
            <button
              type="submit"
              class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          @if (validationError()) {
            <p class="text-sm text-red-600" role="alert">{{ validationError() }}</p>
          }
        </form>
      </div>
    }
  `,
})
export class TodoListComponent implements OnInit {
  readonly todoService = inject(TodoService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly titleValue = signal('');
  readonly validationError = signal('');
  readonly hasError = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      await this.todoService.load();
    } catch {
      this.hasError.set(true);
    }
  }

  onTitleInput(event: Event): void {
    this.titleValue.set((event.target as HTMLInputElement).value);
    this.validationError.set('');
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const title = this.titleValue().trim();

    if (!title) {
      this.validationError.set('Title is required — cannot be empty.');
      return;
    }
    if (title.length > 200) {
      this.validationError.set('Title cannot exceed 200 characters (max 200).');
      return;
    }

    this.validationError.set('');
    await this.todoService.create(title);
    this.titleValue.set('');
  }

  onSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
