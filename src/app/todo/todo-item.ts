import { Component, inject, input } from '@angular/core';
import { TodoService } from './todo.service';
import { Todo } from './todo';

@Component({
  selector: 'app-todo-item',
  template: `
    <li class="flex items-center gap-3 rounded border p-3" [attr.data-todo-id]="todo().id">
      <input
        type="checkbox"
        [checked]="todo().completed"
        (change)="onToggle()"
        class="h-4 w-4 cursor-pointer focus:ring-2 focus:ring-blue-500"
        [attr.aria-label]="'Mark ' + todo().title + ' as ' + (todo().completed ? 'incomplete' : 'complete')"
      />
      <span
        data-title
        class="flex-1"
        [class.line-through]="todo().completed"
        [class.text-gray-400]="todo().completed"
      >
        {{ todo().title }}
      </span>
      <button
        data-delete
        (click)="onDelete()"
        class="rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="Delete todo"
      >
        Delete
      </button>
    </li>
  `,
})
export class TodoItemComponent {
  readonly todo = input.required<Todo>();

  private readonly todoService = inject(TodoService);

  onToggle(): void {
    this.todoService.toggleTodo(this.todo().id, !this.todo().completed);
  }

  onDelete(): void {
    this.todoService.deleteTodo(this.todo().id);
  }
}
