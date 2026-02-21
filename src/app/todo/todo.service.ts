import { Injectable, OnDestroy, signal, computed, inject } from '@angular/core';
import { PocketBaseService } from '../pocketbase.service';
import { Todo } from './todo';

@Injectable({ providedIn: 'root' })
export class TodoService implements OnDestroy {
  private readonly pb = inject(PocketBaseService).client;
  private readonly _todos = signal<Todo[]>([]);
  readonly loading = signal(false);
  readonly todos = computed(() =>
    [...this._todos()].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    ),
  );

  private unsubscribe: (() => void) | undefined;

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.pb.collection('todos').getList(1, 200, { sort: '-created' });
      this._todos.set(result.items as unknown as Todo[]);
      this.startRealtime().catch(() => {});
    } finally {
      this.loading.set(false);
    }
  }

  private async startRealtime(): Promise<void> {
    // SSE callback runs outside Angular zone — signal mutations are safe with signals
    this.unsubscribe = await this.pb
      .collection('todos')
      .subscribe('*', (event: { action: string; record: Todo }) => {
        if (event.action === 'create') {
          this._todos.update((todos) => [...todos, event.record]);
        } else if (event.action === 'update') {
          this._todos.update((todos) =>
            todos.map((t) => (t.id === event.record.id ? event.record : t)),
          );
        } else if (event.action === 'delete') {
          this._todos.update((todos) => todos.filter((t) => t.id !== event.record.id));
        }
      });
  }

  async create(title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) throw new Error('Title is required');
    if (trimmed.length > 200) throw new Error('Title cannot exceed 200 characters');
    await this.pb.collection('todos').create({ title: trimmed, completed: false, owner: this.pb.authStore.record!.id });
  }

  async toggleTodo(id: string, completed: boolean): Promise<void> {
    await this.pb.collection('todos').update(id, { completed });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.pb.collection('todos').delete(id);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }
}
