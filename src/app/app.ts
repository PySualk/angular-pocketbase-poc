import { Component, inject, signal, OnInit } from '@angular/core';
import { TodoService } from './todo/todo.service';
import { TodoListComponent } from './todo/todo-list';
import { BackendErrorComponent } from './error/backend-error';

@Component({
  selector: 'app-root',
  imports: [TodoListComponent, BackendErrorComponent],
  template: `
    @if (hasError()) {
      <app-backend-error />
    } @else {
      <app-todo-list />
    }
  `,
})
export class App implements OnInit {
  private readonly todoService = inject(TodoService);
  readonly hasError = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      await this.todoService.load();
    } catch {
      this.hasError.set(true);
    }
  }
}
