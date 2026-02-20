import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { TodoItemComponent } from './todo-item';
import { TodoService } from './todo.service';
import { Todo } from './todo';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'abc',
  title: 'Test todo',
  completed: false,
  created: '2026-02-19T10:00:00.000Z',
  updated: '2026-02-19T10:00:00.000Z',
  ...overrides,
});

describe('TodoItemComponent', () => {
  let fixture: ComponentFixture<TodoItemComponent>;
  let toggleFn: ReturnType<typeof vi.fn>;
  let deleteFn: ReturnType<typeof vi.fn>;

  const setup = async (todo: Todo) => {
    toggleFn = vi.fn().mockResolvedValue(undefined);
    deleteFn = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [TodoItemComponent],
      providers: [
        {
          provide: TodoService,
          useValue: {
            toggleTodo: toggleFn,
            deleteTodo: deleteFn,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoItemComponent);
    fixture.componentRef.setInput('todo', todo);
    fixture.detectChanges();
  };

  it('should render the todo title', async () => {
    await setup(makeTodo({ title: 'My task' }));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('My task');
  });

  it('should not have line-through class when todo is not completed', async () => {
    await setup(makeTodo({ completed: false }));
    const el = fixture.nativeElement as HTMLElement;
    const titleEl = el.querySelector('[data-title]') ?? el.querySelector('span, p, label');
    expect(titleEl?.classList.contains('line-through')).toBe(false);
  });

  it('should have line-through and text-gray-400 classes when todo is completed', async () => {
    await setup(makeTodo({ completed: true }));
    const el = fixture.nativeElement as HTMLElement;
    const titleEl = el.querySelector('.line-through');
    expect(titleEl).toBeTruthy();
    expect(titleEl?.classList.contains('text-gray-400')).toBe(true);
  });

  it('should call TodoService.toggleTodo() with toggled value when checkbox clicked', async () => {
    await setup(makeTodo({ id: 'abc', completed: false }));
    const checkbox = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click();
    fixture.detectChanges();
    expect(toggleFn).toHaveBeenCalledWith('abc', true);
  });

  it('should call TodoService.deleteTodo() with todo id when delete button clicked', async () => {
    await setup(makeTodo({ id: 'abc' }));
    const deleteBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-delete]')!;
    deleteBtn.click();
    fixture.detectChanges();
    expect(deleteFn).toHaveBeenCalledWith('abc');
  });

  it('should render a delete button', async () => {
    await setup(makeTodo());
    const el = fixture.nativeElement as HTMLElement;
    const deleteBtn = el.querySelector('[data-delete]');
    expect(deleteBtn).toBeTruthy();
  });
});
